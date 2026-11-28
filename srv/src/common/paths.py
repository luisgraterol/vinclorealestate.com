"""Path conventions in the upstream and downstream buckets."""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime

from common.storage import Storage

RAW_PREFIX = "raw"
# Downstream layout. Parquet lives under a dedicated, Hive-partitioned prefix so a Glue crawler
# pointed at s3://<downstream>/athena/ maps one table per dataset, partitioned by date. The CSV
# export for humans lives under a separate prefix so it never confuses that crawler.
ATHENA_PREFIX = "athena"
EXPORTS_PREFIX = "exports"

_RAW_KEY = re.compile(
    r"^raw/(?P<job>[^/]+)/date=(?P<date>\d{4}-\d{2}-\d{2})/run=(?P<run>[^/]+)/data\.jsonl$"
)


def new_run_id(now: datetime) -> str:
    """Sortable within the day: HHMMSS + short random suffix."""
    return f"{now:%H%M%S}-{uuid.uuid4().hex[:6]}"


def raw_key(job: str, run_date: date, run_id: str) -> str:
    return f"{RAW_PREFIX}/{job}/date={run_date.isoformat()}/run={run_id}/data.jsonl"


def athena_key(dataset: str, run_date: date) -> str:
    """Partitioned Parquet path for the Glue/Athena table."""
    return f"{ATHENA_PREFIX}/{dataset}/date={run_date.isoformat()}/{dataset}.parquet"


def export_key(dataset: str, run_date: date) -> str:
    """Human-readable CSV export path (outside the crawled prefix)."""
    return f"{EXPORTS_PREFIX}/{dataset}/date={run_date.isoformat()}/{dataset}.csv"


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
