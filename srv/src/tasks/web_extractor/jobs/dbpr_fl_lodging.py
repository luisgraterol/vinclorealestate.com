"""Florida DBPR lodging licenses (Hotels & Restaurants), one file per district.

Page: https://www2.myfloridalicense.com/hotels-restaurants/lodging-public-records/
District 1 covers Miami-Dade and Monroe. Includes vacation rentals: License Type Code
2006 (Resort Condominium, CNDO) and 2007 (Resort Dwelling, DWEL). The full file is stored,
unfiltered: `normalize` does the selection.
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
    description = "DBPR lodging licenses, district 1 (Miami-Dade and Monroe)"

    def extract(self, ctx: JobContext) -> Iterator[Item]:
        for url in DISTRICT_FILES.values():
            text = decode(ctx.get(url, timeout_ms=300_000).body())
            for row in csv.DictReader(io.StringIO(text)):
                yield Item(source_url=url, data=row)
