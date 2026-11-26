"""CLI del task `normalize`: lee data cruda de upstream y escribe un CSV en downstream."""

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
from common.paths import normalized_key
from common.storage import storage_from_uri
from tasks.normalize.registry import all_datasets

log = logging.getLogger("normalize")


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="normalize", description=__doc__)
    p.add_argument("--dataset", help="nombre del dataset a construir")
    p.add_argument("--list", action="store_true", help="lista los datasets disponibles")
    p.add_argument("--date", type=date.fromisoformat, help="fecha de la corrida (UTC por defecto)")
    p.add_argument("--upstream", default=os.environ.get("UPSTREAM_URI"))
    p.add_argument("--downstream", default=os.environ.get("DOWNSTREAM_URI"))
    args = p.parse_args(argv)
    if not args.list:
        if not args.dataset:
            p.error("falta --dataset (o usa --list)")
        if not args.upstream or not args.downstream:
            p.error("faltan --upstream/--downstream o UPSTREAM_URI/DOWNSTREAM_URI")
    return args


def run(dataset: str, upstream_uri: str, downstream_uri: str, run_date: date | None = None) -> int:
    datasets = all_datasets()
    if dataset not in datasets:
        raise SystemExit(f"dataset desconocido: {dataset}. Disponibles: {', '.join(datasets)}")
    run_date = run_date or datetime.now(UTC).date()
    upstream = storage_from_uri(upstream_uri)
    downstream = storage_from_uri(downstream_uri)

    columns, rows = datasets[dataset](upstream, run_date)
    if not rows:
        log.error("dataset %s quedó vacío para %s", dataset, run_date)
        return 2

    key = normalized_key(dataset, run_date, f"{dataset}.csv")
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / f"{dataset}.csv"
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="raise")
            writer.writeheader()
            writer.writerows(rows)
        uri = downstream.put_file(path, key, "text/csv")
    log.info("listo: %d filas en %s", len(rows), uri)
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
