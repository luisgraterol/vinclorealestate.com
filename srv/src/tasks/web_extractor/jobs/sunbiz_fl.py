"""Florida Division of Corporations (Sunbiz) officers for the LLCs that own our properties.

Sunbiz publishes the full corporate registry for free over SFTP. We only need the person behind
each owning LLC, so this job reads the LLC/corporation names we already collected (DBPR licensees
and county owners that look like entities), streams the quarterly corporate file, and emits only the
matching active entities with their officers (manager/member name and address).

Source: https://dos.fl.gov/sunbiz/other-services/data-downloads/quarterly-data/
File structure: https://dos.sunbiz.org/data-definitions/cor.html (1440-byte fixed-width records)

Host, username and password below are the public read-only credentials the state publishes openly
on that page for anyone to download this public data; they can be overridden via env vars.
"""

from __future__ import annotations

import io
import logging
import os
import tempfile
import zipfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from common.entities import entity_key, looks_like_entity
from tasks.web_extractor.base import Item, JobContext
from tasks.web_extractor.registry import register

log = logging.getLogger(__name__)

SFTP_HOST = os.environ.get("SUNBIZ_SFTP_HOST", "sftp.floridados.gov")
SFTP_PORT = int(os.environ.get("SUNBIZ_SFTP_PORT", "22"))
SFTP_USER = os.environ.get("SUNBIZ_SFTP_USER", "Public")
SFTP_PASSWORD = os.environ.get("SUNBIZ_SFTP_PASSWORD", "PubAccess1845!")
SFTP_PATH = os.environ.get("SUNBIZ_SFTP_PATH", "doc/quarterly/cor/cordata.zip")

RECORD_LENGTH = 1440
LLC_TYPES = {"FLAL", "FORL"}  # Florida LLC, Foreign LLC
SOURCE_URL = "sftp://sftp.floridados.gov/doc/quarterly/cor/cordata.zip"

# Jobs whose raw holds the owner/licensee names we want to resolve.
OWNER_NAME_SOURCES = {
    "dbpr-fl-lodging": ("Licensee Name",),
    "miami-dade-parcels": ("TRUE_OWNER1", "TRUE_OWNER2"),
}


def _field(record: str, start: int, length: int) -> str:
    """One field from a 1-based fixed-width record."""
    return record[start - 1 : start - 1 + length].strip()


def parse_record(record: str) -> dict | None:
    """Parse one corporate record; return None for non-LLC or inactive entities."""
    if _field(record, 205, 1) != "A":  # status: A = active
        return None
    if _field(record, 206, 15) not in LLC_TYPES:
        return None
    officers = []
    for n in range(6):
        base = 669 + 128 * n
        name = _field(record, base + 5, 42)
        if not name:
            continue
        officers.append(
            {
                "title": _field(record, base, 4),
                "name": name,
                "address": _field(record, base + 47, 42),
                "city": _field(record, base + 89, 28),
                "state": _field(record, base + 117, 2),
                "zip": _field(record, base + 119, 9),
            }
        )
    return {
        "document_number": _field(record, 1, 12),
        "name": _field(record, 13, 192),
        "entity_type": _field(record, 206, 15),
        "mailing_address": _field(record, 347, 42),
        "mailing_city": _field(record, 431, 28),
        "mailing_state": _field(record, 459, 2),
        "mailing_zip": _field(record, 461, 10),
        "officers": officers,
    }


def target_names(ctx: JobContext) -> set[str]:
    """Normalized names of entity-looking owners we want the person behind."""
    wanted: set[str] = set()
    for job, fields in OWNER_NAME_SOURCES.items():
        try:
            records = list(ctx.read_latest_raw(job))
        except RuntimeError as exc:
            log.warning("skipping %s: %s", job, exc)
            continue
        for record in records:
            row = record["data"]
            for field in fields:
                value = row.get(field)
                if value and looks_like_entity(value):
                    wanted.add(entity_key(value))
    return wanted


def iter_records(zip_path: Path) -> Iterator[str]:
    """Yield fixed-width records from the zip on disk, tolerating optional line breaks.

    The zip is read member by member and never loaded whole into memory, since the quarterly
    corporate file is multiple gigabytes.
    """
    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.namelist():
            with archive.open(member) as handle:
                text = io.TextIOWrapper(handle, encoding="latin-1", newline="")
                buffer = ""
                for line in text:
                    stripped = line.rstrip("\r\n")
                    if len(stripped) >= RECORD_LENGTH:
                        # Some members are newline-delimited, one record per line.
                        yield stripped[:RECORD_LENGTH]
                    else:
                        # Others are a continuous stream; re-chunk by record length.
                        buffer += line
                        while len(buffer) >= RECORD_LENGTH:
                            yield buffer[:RECORD_LENGTH]
                            buffer = buffer[RECORD_LENGTH:]


@contextmanager
def download(path: str) -> Iterator[Path]:
    """Download the SFTP file to a temp path on disk; delete it on exit."""
    import paramiko  # imported lazily so the rest of the package has no hard dep

    transport = paramiko.Transport((SFTP_HOST, SFTP_PORT))
    transport.connect(username=SFTP_USER, password=SFTP_PASSWORD)
    fd, tmp_name = tempfile.mkstemp(suffix=".zip")
    os.close(fd)
    try:
        sftp = paramiko.SFTPClient.from_transport(transport)
        sftp.get(path, tmp_name)
        yield Path(tmp_name)
    finally:
        transport.close()
        Path(tmp_name).unlink(missing_ok=True)


@register
class SunbizFl:
    name = "sunbiz-fl"
    description = "Sunbiz officers for the LLCs that own our properties (SFTP)"

    def extract(self, ctx: JobContext) -> Iterator[Item]:
        wanted = target_names(ctx)
        log.info("resolving %d entity names", len(wanted))
        if not wanted:
            return
        with download(SFTP_PATH) as zip_path:
            log.info("downloaded %.0f MB", zip_path.stat().st_size / 1e6)
            yield from self._emit(zip_path, wanted)

    def _emit(self, zip_path: Path, wanted: set[str]) -> Iterator[Item]:
        emitted = 0
        for record in iter_records(zip_path):
            parsed = parse_record(record)
            if parsed is None or entity_key(parsed["name"]) not in wanted:
                continue
            emitted += 1
            yield Item(source_url=SOURCE_URL, data=parsed)
        log.info("matched %d of %d entities", emitted, len(wanted))
