"""Nashville short-term rental permits (Metro Codes), via ArcGIS FeatureServer.

Dataset: https://datanashvillegov-nashville.hub.arcgis.com/datasets/b5315bda43ac459281dd35f04aa1be32_0
Includes the permit owner and their mailing address, property address, parcel and status.
"""

from __future__ import annotations

from collections.abc import Iterator
from urllib.parse import urlencode

from tasks.web_extractor.base import Item, JobContext
from tasks.web_extractor.registry import register

SERVICE = (
    "https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/"
    "Residential_Short_Term_Rental_Permits_view/FeatureServer/0"
)
PAGE_SIZE = 1000  # service's maxRecordCount


def permit_url(permit: str) -> str:
    query = urlencode({"where": f"Permit__='{permit}'", "outFields": "*", "f": "json"})
    return f"{SERVICE}/query?{query}"


@register
class NashvilleStrPermits:
    name = "nashville-str-permits"
    description = "Nashville STR permits (ArcGIS, ~17k records)"

    def extract(self, ctx: JobContext) -> Iterator[Item]:
        offset = 0
        while True:
            body = ctx.get(
                f"{SERVICE}/query",
                params={
                    "where": "1=1",
                    "outFields": "*",
                    "returnGeometry": "false",
                    "orderByFields": "ObjectId",
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
                yield Item(source_url=permit_url(attrs.get("Permit__") or ""), data=attrs)
            offset += len(features)
            if not features or not body.get("exceededTransferLimit"):
                break
