"""Licencias de alojamiento de Florida DBPR (Hotels & Restaurants), archivo por distrito.

Página: https://www2.myfloridalicense.com/hotels-restaurants/lodging-public-records/
El distrito 1 cubre Miami-Dade y Monroe. Incluye vacation rentals: License Type Code
2006 (Resort Condominium, CNDO) y 2007 (Resort Dwelling, DWEL). Se guarda el archivo completo,
sin filtrar: la selección la hace `normalize`.
"""

from __future__ import annotations

import csv
import io
from collections.abc import Iterator

from tasks.web_extractor.base import Item, JobContext
from tasks.web_extractor.registry import register

DISTRICT_FILES = {
    1: "https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge1.csv",
}


def decode(raw: bytes) -> str:
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return raw.decode("cp1252", errors="replace")


@register
class DbprFlLodging:
    name = "dbpr-fl-lodging"
    description = "Licencias de alojamiento DBPR, distrito 1 (Miami-Dade y Monroe)"

    def extract(self, ctx: JobContext) -> Iterator[Item]:
        for url in DISTRICT_FILES.values():
            text = decode(ctx.get(url, timeout_ms=300_000).body())
            for row in csv.DictReader(io.StringIO(text)):
                yield Item(source_url=url, data=row)
