"""Dataset `leads`: pre-leads de dueños A1 en Miami y Nashville, columnas de HubSpot.

Hoy usa solo las listas base (DBPR y permisos de Nashville). Aplica los filtros de la spec
que se pueden decidir con esos datos y deja vacío todo lo que necesita enriquecimiento
(registro del condado, Sunbiz/TN SOS, Airbnb). Regla: nunca inventar un dato.
"""

from __future__ import annotations

import re
from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime

from common.jsonl import read_records
from common.paths import latest_raw_key
from common.storage import Storage
from tasks.normalize.registry import register

# Columnas de la spec "Lista de leads para outreach", en el mismo orden.
# "Owner name (source)" no es campo de HubSpot: es el nombre tal cual viene de la fuente,
# para revisar a mano antes de cargar. Se omite al importar.
COLUMNS = [
    "First name",
    "Last name",
    "Entity",
    "Email",
    "Phone",
    "Mailing address",
    "Market",
    "Property",
    "Bedrooms",
    "Bathrooms",
    "Airbnb listing link",
    "Units owned",
    "Lives far?",
    "Current management",
    "Licence signal",
    "Ownership check",
    "Language",
    "Tier",
    "Lead source detail",
    "Source URLs",
    "Date added",
    "Owner name (source)",
]

MAX_UNITS = 5  # spec: descartar a quien tenga más de 5 unidades
DBPR_VACATION_RENTAL_TYPES = {"2006", "2007"}  # Resort Condominium / Resort Dwelling
DBPR_MIAMI_COUNTY = "Dade"
NASHVILLE_OWNER_OCCUPIED = "CAZ10A001"

_ENTITY = re.compile(
    r"\b(LLC|L\.L\.C|INC|CORP|CORPORATION|CO|COMPANY|LTD|LP|LLP|TRUST|TR|TRUSTEE|PARTNERS|"
    r"PARTNERSHIP|HOLDINGS|PROPERTIES|INVESTMENTS|GROUP|ENTERPRISES|ASSOCIATION|ASSN)\b\.?",
    re.IGNORECASE,
)


def is_entity(name: str) -> bool:
    return bool(_ENTITY.search(name))


def clean(*parts: str | None) -> str:
    return " ".join(" ".join(p.split()) for p in parts if p and p.strip())


def same_place(city_a: str, state_a: str, city_b: str, state_b: str) -> bool:
    return (clean(city_a).upper(), clean(state_a).upper()) == (
        clean(city_b).upper(),
        clean(state_b).upper(),
    )


@dataclass
class Property:
    market: str
    owner: str
    address: str
    city: str
    state: str
    zip: str
    mailing_address: str
    mailing_city: str
    mailing_state: str
    units: int
    source_url: str
    source_detail: str
    owner_occupied: bool = False


@dataclass
class Owner:
    name: str
    properties: list[Property] = field(default_factory=list)

    @property
    def units(self) -> int:
        return sum(p.units for p in self.properties)


def _parse_mmddyyyy(value: str) -> date | None:
    try:
        return datetime.strptime(value.strip(), "%m/%d/%Y").date()
    except ValueError:
        return None


def miami_properties(records: Iterable[dict], run_date: date) -> Iterable[Property]:
    for rec in records:
        row = rec["data"]
        if row.get("License Type Code") not in DBPR_VACATION_RENTAL_TYPES:
            continue
        if row.get("Location County") != DBPR_MIAMI_COUNTY:
            continue
        expiry = _parse_mmddyyyy(row.get("License Expiry Date", ""))
        if expiry is None or expiry < run_date:
            continue  # licencia vencida o sin fecha
        owner = clean(row.get("Licensee Name"))
        if not owner:
            continue
        try:
            units = max(int(row.get("Number of Seats or Rental Units") or 1), 1)
        except ValueError:
            units = 1
        yield Property(
            market="miami",
            owner=owner,
            address=clean(
                row.get("Location Street Address"),
                row.get("Location Address Line 2"),
                row.get("Location Address Line 3"),
            ),
            city=clean(row.get("Location City")),
            state=clean(row.get("Location State Code")),
            zip=clean(row.get("Location Zip Code"))[:5],
            mailing_address=clean(
                row.get("Mailing Name"),
                row.get("Mailing Street Address"),
                row.get("Mailing Address Line 2"),
                row.get("Mailing Address Line 3"),
                row.get("Mailing City"),
                row.get("Mailing State Code"),
                row.get("Mailing Zip Code"),
            ),
            mailing_city=clean(row.get("Mailing City")),
            mailing_state=clean(row.get("Mailing State Code")),
            units=units,
            source_url=rec["source_url"],
            source_detail="DBPR Miami-Dade",
        )


def nashville_properties(records: Iterable[dict], run_date: date) -> Iterable[Property]:
    for rec in records:
        row = rec["data"]
        if row.get("Permit_Status") != "ISSUED":
            continue
        expiration_ms = row.get("Expiration_Date")
        if expiration_ms and datetime.fromtimestamp(expiration_ms / 1000, UTC).date() < run_date:
            continue
        owner = clean(row.get("Permit_Owner_Name"))
        if not owner:
            continue
        yield Property(
            market="nashville",
            owner=owner,
            address=clean(row.get("Address")),
            city=clean(row.get("City")),
            state=clean(row.get("State")),
            zip=clean(row.get("ZIP"))[:5],
            mailing_address=clean(
                row.get("Permit_Owner_Addr1"),
                row.get("Permit_Owner_Addr2"),
                row.get("Permit_Owner_Addr3"),
                row.get("Permit_Owner_City"),
                row.get("Permit_Owner_State"),
                row.get("Permit_Owner_Zip"),
            ),
            mailing_city=clean(row.get("Permit_Owner_City")),
            mailing_state=clean(row.get("Permit_Owner_State")),
            units=1,
            source_url=rec["source_url"],
            source_detail="Nashville STR permit roll",
            owner_occupied=row.get("Permit_SubType") == NASHVILLE_OWNER_OCCUPIED,
        )


def group_by_owner(properties: Iterable[Property]) -> list[Owner]:
    owners: dict[tuple[str, str], Owner] = defaultdict(lambda: Owner(name=""))
    for prop in properties:
        owner = owners[(prop.market, prop.owner.upper())]
        owner.name = owner.name or prop.owner
        owner.properties.append(prop)
    return list(owners.values())


def to_rows(owners: Iterable[Owner], run_date: date) -> list[dict[str, str]]:
    rows = []
    for owner in owners:
        if owner.units > MAX_UNITS:
            continue  # spec: más de 5 unidades
        for prop in owner.properties:
            lives_far = not prop.owner_occupied and not same_place(
                prop.mailing_city, prop.mailing_state, prop.city, prop.state
            )
            if not lives_far:
                continue  # spec: descartar a quien vive cerca de la propiedad
            rows.append(
                {
                    **dict.fromkeys(COLUMNS, ""),
                    "Entity": owner.name if is_entity(owner.name) else "",
                    "Mailing address": prop.mailing_address,
                    "Market": prop.market,
                    "Property": clean(prop.address, prop.city, prop.state, prop.zip),
                    "Units owned": str(owner.units),
                    "Lives far?": "Yes",
                    "Lead source detail": prop.source_detail,
                    "Source URLs": prop.source_url,
                    "Date added": run_date.isoformat(),
                    "Owner name (source)": owner.name,
                }
            )
    rows.sort(key=lambda r: (r["Market"], r["Owner name (source)"], r["Property"]))
    return rows


def _load(upstream: Storage, job: str, run_date: date) -> list[dict]:
    key = latest_raw_key(upstream, job, run_date)
    return list(read_records(upstream, key)) if key else []


@register("leads")
def build(upstream: Storage, run_date: date) -> tuple[list[str], list[dict[str, str]]]:
    properties = [
        *miami_properties(_load(upstream, "dbpr-fl-lodging", run_date), run_date),
        *nashville_properties(_load(upstream, "nashville-str-permits", run_date), run_date),
    ]
    return COLUMNS, to_rows(group_by_owner(properties), run_date)
