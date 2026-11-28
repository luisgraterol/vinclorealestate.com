"""Reading and writing JSONL files (one JSON record per line)."""

from __future__ import annotations

import json
import logging
import tempfile
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path
from types import TracebackType

from common.storage import Storage

log = logging.getLogger(__name__)


class RawWriter:
    """Write records to a temporary file and upload it to `key` on close.

    If the job fails midway, it still uploads whatever it managed to extract, but as
    `data.partial.jsonl`: that way nothing is lost and `normalize` does not mistake it for a
    complete run.
    """

    def __init__(self, storage: Storage, key: str, job: str, run_id: str) -> None:
        self.storage = storage
        self.key = key
        self.job = job
        self.run_id = run_id
        self.count = 0
        self.uri: str | None = None
        self._tmp = tempfile.NamedTemporaryFile(  # noqa: SIM115 (closed in __exit__)
            "w", encoding="utf-8", suffix=".jsonl", delete=False
        )

    def write(self, source_url: str, data: dict) -> None:
        record = {
            "job": self.job,
            "run_id": self.run_id,
            "extracted_at": datetime.now(UTC).isoformat(timespec="seconds"),
            "source_url": source_url,
            "data": data,
        }
        self._tmp.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
        self.count += 1

    def __enter__(self) -> RawWriter:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self._tmp.close()
        path = Path(self._tmp.name)
        key = self.key if exc_type is None else partial_key(self.key)
        try:
            if self.count:
                self.uri = self.storage.put_file(path, key, "application/x-ndjson")
                log.info("uploaded %s (%d records)", self.uri, self.count)
            else:
                log.warning("no records; nothing uploaded to %s", self.key)
        finally:
            path.unlink(missing_ok=True)


def partial_key(key: str) -> str:
    """raw/.../data.jsonl → raw/.../data.partial.jsonl"""
    return key.removesuffix(".jsonl") + ".partial.jsonl"


def read_records(storage: Storage, key: str) -> Iterator[dict]:
    for line in storage.read_bytes(key).decode("utf-8").splitlines():
        if line.strip():
            yield json.loads(line)
