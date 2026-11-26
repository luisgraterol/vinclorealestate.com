"""Convenciones de rutas en los buckets upstream y downstream."""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime

from common.storage import Storage

RAW_PREFIX = "raw"
NORMALIZED_PREFIX = "normalized"

_RAW_KEY = re.compile(
    r"^raw/(?P<job>[^/]+)/date=(?P<date>\d{4}-\d{2}-\d{2})/run=(?P<run>[^/]+)/data\.jsonl$"
)


def new_run_id(now: datetime) -> str:
    """Ordenable dentro del día: HHMMSS + sufijo aleatorio corto."""
    return f"{now:%H%M%S}-{uuid.uuid4().hex[:6]}"


def raw_key(job: str, run_date: date, run_id: str) -> str:
    return f"{RAW_PREFIX}/{job}/date={run_date.isoformat()}/run={run_id}/data.jsonl"


def normalized_key(dataset: str, run_date: date, filename: str) -> str:
    return f"{NORMALIZED_PREFIX}/{dataset}/date={run_date.isoformat()}/{filename}"


def latest_raw_key(storage: Storage, job: str, on_or_before: date) -> str | None:
    """La corrida más reciente de `job` con fecha <= `on_or_before`, o None."""
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
