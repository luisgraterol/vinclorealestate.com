"""`normalize` task CLI: read raw data from upstream, write a dataset to downstream.

Each dataset is written twice: a partitioned Parquet file under `athena/` for Glue/Athena, and a
CSV under `exports/` for people to open or load into HubSpot.
"""

from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
import tempfile
from datetime import UTC, date, datetime
from pathlib import Path

from common.logs import setup_logging
from common.paths import curated_key, export_key, latest_export_key
from common.storage import Storage, storage_from_uri
from tasks.normalize.registry import all_datasets

log = logging.getLogger("normalize")


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="normalize", description=__doc__)
    p.add_argument("--dataset", help="dataset to build")
    p.add_argument("--list", action="store_true", help="list available datasets")
    p.add_argument("--date", type=date.fromisoformat, help="run date (UTC today by default)")
    p.add_argument("--upstream", default=os.environ.get("UPSTREAM_URI"))
    p.add_argument("--downstream", default=os.environ.get("DOWNSTREAM_URI"))
    args = p.parse_args(argv)
    if not args.list:
        if not args.dataset:
            p.error("missing --dataset (or use --list)")
        if not args.upstream or not args.downstream:
            p.error("missing --upstream/--downstream or UPSTREAM_URI/DOWNSTREAM_URI")
    return args


def _write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="raise")
        writer.writeheader()
        writer.writerows(rows)


def _write_parquet(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    import pyarrow as pa
    import pyarrow.parquet as pq

    table = pa.table(
        {col: pa.array([r.get(col, "") for r in rows], pa.string()) for col in columns}
    )
    pq.write_table(table, path, compression="snappy")


def run(dataset: str, upstream_uri: str, downstream_uri: str, run_date: date | None = None) -> int:
    datasets = all_datasets()
    if dataset not in datasets:
        raise SystemExit(f"unknown dataset: {dataset}. Available: {', '.join(datasets)}")
    run_date = run_date or datetime.now(UTC).date()
    upstream = storage_from_uri(upstream_uri)
    downstream: Storage = storage_from_uri(downstream_uri)

    columns, rows = datasets[dataset](upstream, run_date)
    if not rows:
        log.error("dataset %s is empty for %s", dataset, run_date)
        return 2

    with tempfile.TemporaryDirectory() as tmp:
        parquet = Path(tmp) / f"{dataset}.parquet"
        csv_file = Path(tmp) / f"{dataset}.csv"
        _write_parquet(parquet, columns, rows)
        _write_csv(csv_file, columns, rows)
        table_uri = downstream.put_file(
            parquet, curated_key(dataset, run_date), "application/x-parquet"
        )
        downstream.put_file(csv_file, export_key(dataset, run_date), "text/csv")
        # Stable copy so there is always one obvious file to open.
        latest_uri = downstream.put_file(csv_file, latest_export_key(dataset), "text/csv")
    log.info("done: %d rows -> %s (table) and %s (latest csv)", len(rows), table_uri, latest_uri)
    return 0


def main(argv: list[str] | None = None) -> int:
    setup_logging()
    args = parse_args(argv)
    if args.list:
        for name in all_datasets():
            print(name)
        return 0
    return run(args.dataset, args.upstream, args.downstream, args.date)


if __name__ == "__main__":
    sys.exit(main())
