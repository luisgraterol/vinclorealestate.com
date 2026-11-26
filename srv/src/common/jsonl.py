"""Escritura y lectura de archivos JSONL (un registro JSON por línea)."""

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
    """Escribe registros a un archivo temporal y lo sube a `key` al cerrar.

    Si el job falla a la mitad, igual sube lo que alcanzó a extraer y deja pasar el error,
    así la corrida queda marcada como fallida pero la data parcial no se pierde.
    """

    def __init__(self, storage: Storage, key: str, job: str, run_id: str) -> None:
        self.storage = storage
        self.key = key
        self.job = job
        self.run_id = run_id
        self.count = 0
        self.uri: str | None = None
        self._tmp = tempfile.NamedTemporaryFile(  # noqa: SIM115 (se cierra en __exit__)
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
        try:
            if self.count:
                self.uri = self.storage.put_file(path, self.key, "application/x-ndjson")
                log.info("subido %s (%d registros)", self.uri, self.count)
            else:
                log.warning("sin registros; no se sube nada a %s", self.key)
        finally:
            path.unlink(missing_ok=True)


def read_records(storage: Storage, key: str) -> Iterator[dict]:
    for line in storage.read_bytes(key).decode("utf-8").splitlines():
        if line.strip():
            yield json.loads(line)
