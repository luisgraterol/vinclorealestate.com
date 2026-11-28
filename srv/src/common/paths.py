"""Path conventions in the upstream and downstream buckets."""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime

from common.storage import Storage

RAW_PREFIX = "raw"
# Downstream layout. Curated Parquet tables live under `curated/`, Hive-partitioned by
# year/month/day, so a Glue crawler maps one table per dataset and any service (Athena, Spark,
# a notebook) can consume them. CSV copies for people live under `exports/`, which is not crawled:
# a partitioned copy per run, plus a stable `<dataset>-latest.csv` that always points at the
# newest run so there is one obvious file to open.
CURATED_PREFIX = "curated"
EXPORTS_PREFIX = "exports"


def _partition(run_date: date) -> str:
    return f"year={run_date:%Y}/month={run_date:%m}/day={run_date:%d}"


_RAW_KEY = re.compile(
    r"^raw/(?P<job>[^/]+)/date=(?P<date>\d{4}-\d{2}-\d{2})/run=(?P<run>[^/]+)/data\.jsonl$"
)


def new_run_id(now: datetime) -> str:
    """Sortable within the day: HHMMSS + short random suffix."""
    return f"{now:%H%M%S}-{uuid.uuid4().hex[:6]}"


def raw_key(job: str, run_date: date, run_id: str) -> str:
    return f"{RAW_PREFIX}/{job}/date={run_date.isoformat()}/run={run_id}/data.jsonl"


def curated_key(dataset: str, run_date: date) -> str:
    """Partitioned Parquet path for the crawled table (year/month/day partitions)."""
    return f"{CURATED_PREFIX}/{dataset}/{_partition(run_date)}/{dataset}.parquet"


def export_key(dataset: str, run_date: date) -> str:
    """Partitioned CSV copy for people (outside the crawled prefix)."""
    return f"{EXPORTS_PREFIX}/{dataset}/{_partition(run_date)}/{dataset}.csv"


def latest_export_key(dataset: str) -> str:
    """Stable CSV path that always holds the newest run: the one file to open."""
    return f"{EXPORTS_PREFIX}/{dataset}/{dataset}-latest.csv"


def latest_raw_key(storage: Storage, job: str, on_or_before: date) -> str | None:
    """The most recent run of `job` dated <= `on_or_before`, or None."""
    best: tuple[str, str] | None = None
    best_key: str | None = None
    for key in storage.list_keys(f"{RAW_PREFIX}/{job}/"):
        m = _RAW_KEY.match(key)
        if not m or m["job"] != job or m["date"] > on_or_before.isoformat():
            continue
        candidate = (m["date"], m["run"])
        if best is None or candidate > best:
            best, best_key = candidate, key
    return best_key
