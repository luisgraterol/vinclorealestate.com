"""Miami-Dade property-appraiser parcels for the addresses DBPR lists as vacation rentals.

The county's public ArcGIS layer (no Cloudflare, no auth) carries the real owner, the owner's
mailing address, bedroom/bathroom counts and the land-use category. This job reads the latest
`dbpr-fl-lodging` raw, takes the Dade vacation-rental addresses (license types 2006 and 2007),
and pulls the county parcels at those addresses so `normalize` can join them unit by unit.

Dataset: https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/PaGISView_gdb/FeatureServer/0
"""

from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Iterator

from common.addresses import norm_city
from tasks.web_extractor.base import Item, JobContext
from tasks.web_extractor.registry import register

log = logging.getLogger(__name__)

SERVICE = (
    "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/"
    "PaGISView_gdb/FeatureServer/0"
)
DBPR_JOB = "dbpr-fl-lodging"
VACATION_RENTAL_TYPES = {"2006", "2007"}  # Resort Condominium / Resort Dwelling
MIAMI_COUNTY = "Dade"
OUT_FIELDS = (
    "FOLIO,TRUE_SITE_ADDR_NO_UNIT,TRUE_SITE_UNIT,TRUE_SITE_CITY,TRUE_SITE_ZIP_CODE,"
    "TRUE_MAILING_ADDR1,TRUE_MAILING_ADDR2,TRUE_MAILING_CITY,TRUE_MAILING_STATE,"
    "TRUE_MAILING_ZIP_CODE,TRUE_OWNER1,TRUE_OWNER2,BEDROOM_COUNT,BATHROOM_COUNT,"
    "HALF_BATHROOM_COUNT,UNIT_COUNT,DOR_DESC,CONDO_FLAG,YEAR_BUILT"
)
# How many "house-number" LIKE terms to OR together in one request. Kept small so the
# WHERE clause stays well within the service limit and each response stays modest.
NUMBERS_PER_QUERY = 50
PAGE_SIZE = 2000  # service maxRecordCount


def house_number(street: str | None) -> str | None:
    """Leading house number of a street address, e.g. '1340 COLLINS AVE' -> '1340'."""
    if not street:
        return None
    first = street.strip().split(" ", 1)[0]
    return first if first.isdigit() else None


def dbpr_targets(ctx: JobContext) -> dict[str, set[str]]:
    """Map each 5-digit ZIP to the set of house numbers DBPR lists there (Dade STRs only)."""
    targets: dict[str, set[str]] = defaultdict(set)
    for record in ctx.read_latest_raw(DBPR_JOB):
        row = record["data"]
        if row.get("License Type Code") not in VACATION_RENTAL_TYPES:
            continue
        if row.get("Location County") != MIAMI_COUNTY:
            continue
        zip5 = (row.get("Location Zip Code") or "").strip()[:5]
        number = house_number(row.get("Location Street Address"))
        if len(zip5) == 5 and zip5.isdigit() and number:
            targets[zip5].add(number)
    return targets


def chunks(items: list[str], size: int) -> Iterator[list[str]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


@register
class MiamiDadeParcels:
    name = "miami-dade-parcels"
    description = "Miami-Dade parcels at DBPR vacation-rental addresses (ArcGIS)"

    def extract(self, ctx: JobContext) -> Iterator[Item]:
        targets = dbpr_targets(ctx)
        zip_count = len(targets)
        number_count = sum(len(v) for v in targets.values())
        log.info("querying %d house numbers across %d ZIPs", number_count, zip_count)
        if not targets:
            return

        seen: set[str] = set()  # FOLIO, so a parcel is emitted once
        for zip5, numbers in sorted(targets.items()):
            for batch in chunks(sorted(numbers), NUMBERS_PER_QUERY):
                likes = " OR ".join(f"TRUE_SITE_ADDR_NO_UNIT LIKE '{n} %'" for n in batch)
                where = f"TRUE_SITE_ZIP_CODE LIKE '{zip5}%' AND ({likes})"
                yield from self._page(ctx, where, seen)
        log.info("emitted %d distinct parcels", len(seen))

    def _page(self, ctx: JobContext, where: str, seen: set[str]) -> Iterator[Item]:
        offset = 0
        while True:
            # POST, not GET: the WHERE clause ORs many LIKE terms and would overrun the
            # service's query-string length limit (it answers an over-long GET with HTTP 404).
            body = ctx.post(
                f"{SERVICE}/query",
                form={
                    "where": where,
                    "outFields": OUT_FIELDS,
                    "returnGeometry": "false",
                    "orderByFields": "FOLIO",
                    "resultOffset": offset,
                    "resultRecordCount": PAGE_SIZE,
                    "f": "json",
                },
            ).json()
            if "error" in body:
                raise RuntimeError(f"ArcGIS error: {body['error']}")
            features = body.get("features", [])
            for feature in features:
                attrs = feature["attributes"]
                folio = attrs.get("FOLIO")
                if folio and folio in seen:
                    continue
                if folio:
                    seen.add(folio)
                yield Item(source_url=self._source_url(attrs), data=attrs)
            offset += len(features)
            if not features or not body.get("exceededTransferLimit"):
                break

    @staticmethod
    def _source_url(attrs: dict) -> str:
        folio = attrs.get("FOLIO") or ""
        city = norm_city(attrs.get("TRUE_SITE_CITY"))
        return f"{SERVICE}/query?where=FOLIO%3D%27{folio}%27 ({city})"
