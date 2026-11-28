"""`leads` dataset: A1 owner outreach list for Miami and Nashville, in HubSpot columns.

Miami is built by joining DBPR vacation-rental licenses (the short-term-rental signal) to the
Miami-Dade parcel roll (the real owner, mailing address, bed/bath counts, land use), unit by unit.
Grouping by the county owner means each individual condo owner becomes their own lead even when a
resort operator holds the license. Nashville still comes straight from the permit roll.

Rule from the spec: never invent a value. A field we cannot source is left empty.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime

from common.addresses import norm_city, norm_street, norm_unit
from common.entities import entity_key, looks_like_entity
from common.jsonl import read_records
from common.paths import latest_raw_key
from common.storage import Storage
from tasks.normalize.registry import register

log = logging.getLogger(__name__)

# HubSpot columns, in the order of the "Lista de leads para outreach" spec.
# "Owner name (source)" is not a HubSpot field: it is the raw owner string for manual review,
# dropped at import time.
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

MAX_UNITS = 5  # spec: drop owners with more than 5 units
DBPR_VACATION_RENTAL_TYPES = {"2006", "2007"}
DBPR_MIAMI_COUNTY = "Dade"
DBPR_FILE_URL = "https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge1.csv"
NASHVILLE_OWNER_OCCUPIED = "CAZ10A001"
# County land-use categories we keep: residential homes and condos (drop hotels, commercial).
RESIDENTIAL_HINTS = ("RESIDENTIAL", "CONDOMINIUM", "SINGLE FAMILY", "TOWNHOUSE", "DUPLEX")


def clean(*parts: str | None) -> str:
    return " ".join(" ".join(p.split()) for p in parts if p and str(p).strip())


def first_phone(*numbers: str | None) -> str:
    """First non-empty phone number; avoids emitting the same number twice."""
    for number in numbers:
        value = clean(number)
        if value:
            return value
    return ""


def is_residential(dor_desc: str | None) -> bool:
    text = (dor_desc or "").upper()
    return any(hint in text for hint in RESIDENTIAL_HINTS)


def owner_key(name: str) -> str:
    """Grouping key for an owner: entity key for companies, normalized name for people."""
    return entity_key(name) if looks_like_entity(name) else " ".join(name.upper().split())


def split_person(name: str) -> tuple[str, str]:
    """Conservative first/last split; blanks when the format is ambiguous (never guess)."""
    tokens = [t for t in name.replace(",", " ").split() if t]
    if len(tokens) == 2 and not any(c.isdigit() for c in name):
        return tokens[0].title(), tokens[1].title()
    return "", ""


def _load(upstream: Storage, job: str, run_date: date) -> list[dict]:
    key = latest_raw_key(upstream, job, run_date)
    return list(read_records(upstream, key)) if key else []


def _parse_mmddyyyy(value: str) -> date | None:
    try:
        return datetime.strptime(value.strip(), "%m/%d/%Y").date()
    except ValueError:
        return None


def _blank_row() -> dict[str, str]:
    return dict.fromkeys(COLUMNS, "")


# --------------------------------------------------------------------------- Miami


@dataclass
class Parcel:
    folio: str
    owner: str
    site_address: str
    site_city: str
    site_state: str
    site_zip: str
    mailing_address: str
    mailing_city: str
    mailing_state: str
    bedrooms: str
    bathrooms: str
    dor_desc: str
    source_url: str


def index_parcels(records: Iterable[dict]) -> dict[tuple[str, str], Parcel]:
    """Index residential parcels by (street, unit); drop keys that are ambiguous."""
    by_key: dict[tuple[str, str], list[Parcel]] = defaultdict(list)
    for record in records:
        a = record["data"]
        if not is_residential(a.get("DOR_DESC")):
            continue
        key = (norm_street(a.get("TRUE_SITE_ADDR_NO_UNIT")), norm_unit(a.get("TRUE_SITE_UNIT")))
        if not key[0]:
            continue
        half = a.get("HALF_BATHROOM_COUNT") or 0
        full = a.get("BATHROOM_COUNT") or 0
        by_key[key].append(
            Parcel(
                folio=a.get("FOLIO") or "",
                owner=clean(a.get("TRUE_OWNER1")),
                site_address=clean(a.get("TRUE_SITE_ADDR_NO_UNIT")),
                site_city=clean(a.get("TRUE_SITE_CITY")),
                site_state="FL",
                site_zip=clean(a.get("TRUE_SITE_ZIP_CODE"))[:5],
                mailing_address=clean(
                    a.get("TRUE_MAILING_ADDR1"),
                    a.get("TRUE_MAILING_ADDR2"),
                    a.get("TRUE_MAILING_CITY"),
                    a.get("TRUE_MAILING_STATE"),
                    a.get("TRUE_MAILING_ZIP_CODE"),
                ),
                mailing_city=clean(a.get("TRUE_MAILING_CITY")),
                mailing_state=clean(a.get("TRUE_MAILING_STATE")),
                bedrooms=str(a["BEDROOM_COUNT"]) if a.get("BEDROOM_COUNT") else "",
                bathrooms=str(int(full) + int(half)) if (full or half) else "",
                dor_desc=clean(a.get("DOR_DESC")),
                source_url=record["source_url"],
            )
        )
    # Keep only unambiguous keys so a lead's owner and bed/bath counts are certain.
    return {key: parcels[0] for key, parcels in by_key.items() if len(parcels) == 1}


def index_officers(records: Iterable[dict]) -> dict[str, dict]:
    """Map entity key -> first officer (the person behind the LLC)."""
    officers: dict[str, dict] = {}
    for record in records:
        data = record["data"]
        people = data.get("officers") or []
        if people:
            officers.setdefault(entity_key(data.get("name")), people[0])
    return officers


@dataclass
class MiamiLead:
    parcel: Parcel
    licensee: str
    phone: str
    owner_occupied_license: bool  # licensee differs from county owner


def miami_leads(upstream: Storage, run_date: date) -> list[dict[str, str]]:
    parcels = index_parcels(_load(upstream, "miami-dade-parcels", run_date))
    officers = index_officers(_load(upstream, "sunbiz-fl", run_date))
    dbpr = _load(upstream, "dbpr-fl-lodging", run_date)
    log.info("miami: %d parcels indexed, %d officer records", len(parcels), len(officers))

    # Match each DBPR license to a county parcel; collect per county owner.
    by_owner: dict[str, list[MiamiLead]] = defaultdict(list)
    matched = 0
    for record in dbpr:
        row = record["data"]
        if row.get("License Type Code") not in DBPR_VACATION_RENTAL_TYPES:
            continue
        if row.get("Location County") != DBPR_MIAMI_COUNTY:
            continue
        expiry = _parse_mmddyyyy(row.get("License Expiry Date", ""))
        if expiry is None or expiry < run_date:
            continue  # expired or undated license
        street = norm_street(row.get("Location Street Address"))
        unit = norm_unit(row.get("Location Address Line 2"))
        parcel = parcels.get((street, unit))
        if parcel is None and not unit:
            parcel = parcels.get((street, ""))
        if parcel is None or not parcel.owner:
            continue  # no confident county match -> excluded from the curated list
        matched += 1
        licensee = clean(row.get("Licensee Name"))
        by_owner[parcel.folio and owner_key(parcel.owner)].append(
            MiamiLead(
                parcel=parcel,
                licensee=licensee,
                phone=first_phone(
                    row.get("Primary Phone Number"), row.get("Secondary Phone Number")
                ),
                owner_occupied_license=owner_key(licensee) != owner_key(parcel.owner),
            )
        )
    log.info("miami: %d of %d DBPR records matched a county parcel", matched, len(dbpr))

    rows: list[dict[str, str]] = []
    for leads in by_owner.values():
        # Distinct properties this owner holds in the STR set.
        folios = {lead.parcel.folio for lead in leads}
        if len(folios) > MAX_UNITS:
            continue  # operator / large holder, per spec
        emitted: set[str] = set()
        for lead in leads:
            p = lead.parcel
            if p.folio in emitted:
                continue
            emitted.add(p.folio)
            rows.append(_miami_row(lead, len(folios), officers, run_date))
    return rows


def _miami_row(lead: MiamiLead, units: int, officers: dict[str, dict], run_date: date) -> dict:
    p = lead.parcel
    lives_far = norm_city(p.mailing_city) != norm_city(p.site_city) and bool(p.mailing_city)
    is_entity = looks_like_entity(p.owner)
    first = last = ""
    if is_entity:
        officer = officers.get(entity_key(p.owner))
        if officer:
            first, last = split_person(officer.get("name", ""))
    else:
        first, last = split_person(p.owner)
    row = _blank_row()
    row.update(
        {
            "First name": first,
            "Last name": last,
            "Entity": p.owner if is_entity else "",
            "Phone": lead.phone,
            "Mailing address": p.mailing_address,
            "Market": "miami",
            "Property": clean(p.site_address, p.site_city, p.site_state, p.site_zip),
            "Bedrooms": p.bedrooms,
            "Bathrooms": p.bathrooms,
            "Units owned": str(units),
            "Lives far?": "Yes" if lives_far else "No",
            "Current management": "Operator-licensed" if lead.owner_occupied_license else "",
            "Licence signal": (
                "Licensed to another party" if lead.owner_occupied_license else "Self-licensed"
            ),
            "Ownership check": "Differs" if lead.owner_occupied_license else "Matches",
            "Tier": "A" if lead.phone else "B",
            "Lead source detail": "DBPR Miami-Dade + county parcel",
            "Source URLs": f"{DBPR_FILE_URL} ; {p.source_url}",
            "Date added": run_date.isoformat(),
            "Owner name (source)": p.owner,
        }
    )
    return row


# --------------------------------------------------------------------------- Nashville


@dataclass
class NashProperty:
    owner: str
    address: str
    city: str
    state: str
    zip: str
    mailing_address: str
    mailing_city: str
    mailing_state: str
    source_url: str
    owner_occupied: bool


@dataclass
class NashOwner:
    name: str = ""
    properties: list[NashProperty] = field(default_factory=list)


def nashville_leads(upstream: Storage, run_date: date) -> list[dict[str, str]]:
    owners: dict[str, NashOwner] = defaultdict(NashOwner)
    for record in _load(upstream, "nashville-str-permits", run_date):
        row = record["data"]
        if row.get("Permit_Status") != "ISSUED":
            continue
        expiration_ms = row.get("Expiration_Date")
        if expiration_ms and datetime.fromtimestamp(expiration_ms / 1000, UTC).date() < run_date:
            continue
        owner = clean(row.get("Permit_Owner_Name"))
        if not owner:
            continue
        prop = NashProperty(
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
            source_url=record["source_url"],
            owner_occupied=row.get("Permit_SubType") == NASHVILLE_OWNER_OCCUPIED,
        )
        bucket = owners[owner_key(owner)]
        bucket.name = bucket.name or owner
        bucket.properties.append(prop)

    rows: list[dict[str, str]] = []
    for owner in owners.values():
        if len(owner.properties) > MAX_UNITS:
            continue
        for prop in owner.properties:
            lives_far = not prop.owner_occupied and (
                norm_city(prop.mailing_city) != norm_city(prop.city) and bool(prop.mailing_city)
            )
            if not lives_far:
                continue  # spec: drop owners who live near the property
            is_entity = looks_like_entity(owner.name)
            first, last = ("", "") if is_entity else split_person(owner.name)
            row = _blank_row()
            row.update(
                {
                    "First name": first,
                    "Last name": last,
                    "Entity": owner.name if is_entity else "",
                    "Mailing address": prop.mailing_address,
                    "Market": "nashville",
                    "Property": clean(prop.address, prop.city, prop.state, prop.zip),
                    "Units owned": str(len(owner.properties)),
                    "Lives far?": "Yes",
                    "Licence signal": "Self-licensed",
                    "Tier": "B",
                    "Lead source detail": "Nashville STR permit roll",
                    "Source URLs": prop.source_url,
                    "Date added": run_date.isoformat(),
                    "Owner name (source)": owner.name,
                }
            )
            rows.append(row)
    return rows


# --------------------------------------------------------------------------- entry point


@register("leads")
def build(upstream: Storage, run_date: date) -> tuple[list[str], list[dict[str, str]]]:
    rows = miami_leads(upstream, run_date) + nashville_leads(upstream, run_date)
    rows.sort(key=lambda r: (r["Market"], r["Tier"], r["Owner name (source)"], r["Property"]))
    log.info("leads: %d rows", len(rows))
    return COLUMNS, rows
