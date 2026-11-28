from datetime import date

from common.storage import LocalStorage
from conftest import write_raw
from tasks.normalize.datasets.leads import COLUMNS, build

RUN = date(2026, 12, 1)
DBPR_URL = "https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge1.csv"


def dbpr(
    licensee,
    street,
    unit="",
    *,
    type_code="2006",
    county="Dade",
    city="MIAMI BEACH",
    expiry="12/31/2030",
    phone="3055551234",
):
    return {
        "source_url": DBPR_URL,
        "data": {
            "License Type Code": type_code,
            "Licensee Name": licensee,
            "Location County": county,
            "Location Street Address": street,
            "Location Address Line 2": unit,
            "Location City": city,
            "Location Zip Code": "33139",
            "License Expiry Date": expiry,
            "Primary Phone Number": phone,
            "Secondary Phone Number": phone,
        },
    }


def parcel(
    folio,
    street,
    unit,
    owner,
    *,
    beds=2,
    baths=2,
    dor="RESIDENTIAL - CONDOMINIUM",
    mail_city="NEW YORK",
    site_city="MIAMI BEACH",
):
    return {
        "source_url": f"county?FOLIO={folio}",
        "data": {
            "FOLIO": folio,
            "TRUE_SITE_ADDR_NO_UNIT": street,
            "TRUE_SITE_UNIT": unit,
            "TRUE_SITE_CITY": site_city,
            "TRUE_SITE_ZIP_CODE": "33139-0000",
            "TRUE_MAILING_ADDR1": "1 MAIN ST",
            "TRUE_MAILING_CITY": mail_city,
            "TRUE_MAILING_STATE": "NY",
            "TRUE_MAILING_ZIP_CODE": "10001",
            "TRUE_OWNER1": owner,
            "BEDROOM_COUNT": beds,
            "BATHROOM_COUNT": baths,
            "HALF_BATHROOM_COUNT": 0,
            "DOR_DESC": dor,
        },
    }


def sunbiz(name, officer_name):
    return {
        "source_url": "sftp://sunbiz",
        "data": {
            "name": name,
            "officers": [
                {
                    "title": "MGR",
                    "name": officer_name,
                    "address": "",
                    "city": "",
                    "state": "",
                    "zip": "",
                }
            ],
        },
    }


def nash(owner, subtype="CAZ10A003"):
    return {
        "source_url": "https://services2.arcgis.com/x/query",
        "data": {
            "Permit__": "1",
            "Permit_Status": "ISSUED",
            "Permit_SubType": subtype,
            "Expiration_Date": 1900000000000,
            "Permit_Owner_Name": owner,
            "Permit_Owner_Addr2": "5 PEACH ST",
            "Permit_Owner_City": "ATLANTA",
            "Permit_Owner_State": "GA",
            "Permit_Owner_Zip": "30301",
            "Address": "1029 DELMAS AVE",
            "City": "NASHVILLE",
            "State": "TN",
            "ZIP": "37216",
        },
    }


def build_leads(tmp_path, dbpr_rows, parcels, sunbiz_rows=(), nash_rows=()):
    up = tmp_path
    write_raw(up, "dbpr-fl-lodging", RUN, "060000-aaaaaa", dbpr_rows)
    write_raw(up, "miami-dade-parcels", RUN, "060000-bbbbbb", parcels)
    if sunbiz_rows:
        write_raw(up, "sunbiz-fl", RUN, "060000-cccccc", sunbiz_rows)
    if nash_rows:
        write_raw(up, "nashville-str-permits", RUN, "060000-dddddd", nash_rows)
    columns, rows = build(LocalStorage(up), RUN)
    assert columns == COLUMNS
    return rows


def by_owner(rows, name):
    return next(r for r in rows if r["Owner name (source)"] == name)


def test_miami_join_applies_spec_filters(tmp_path):
    big = [dbpr("BIG LLC", f"{n}0 WEST AVE", "UNIT 1") for n in range(1, 7)]
    big_parcels = [parcel(f"B{n}", f"{n}0 WEST AVE", "1", "BIG LLC") for n in range(1, 7)]
    rows = build_leads(
        tmp_path,
        dbpr_rows=[
            dbpr("SUN LLC", "100 OCEAN DR", "UNIT 5"),  # match + entity
            dbpr("CARLOS GOMEZ", "200 PALM AVE", type_code="2007", city="MIAMI"),  # dwelling
            dbpr("FISHER ISLAND CLUB INC", "1 FISHER ISLAND DR", "UNIT 101"),  # licensed to owner
            dbpr("AMB LLC", "300 BAY RD", "UNIT 2"),  # ambiguous parcel
            dbpr("HOTEL LLC", "400 COLLINS AVE", "UNIT 1"),  # non-residential
            dbpr("OLD LLC", "500 WEST AVE", "UNIT 9", expiry="01/01/2020"),  # expired
            dbpr("MONROE LLC", "1 KEY RD", county="Monroe"),  # outside Dade
            *big,  # 6 units -> dropped
        ],
        parcels=[
            parcel("F1", "100 OCEAN DR", "5", "SUN LLC"),
            parcel(
                "F2",
                "200 PALM AVE",
                "",
                "CARLOS GOMEZ",
                dor="RESIDENTIAL - SINGLE FAMILY",
                site_city="MIAMI",
                mail_city="HOUSTON",
            ),
            parcel("F3", "1 FISHER ISLAND DR", "101", "JANE SMITH", mail_city="MIAMI BEACH"),
            parcel("F4A", "300 BAY RD", "2", "OWNER A"),
            parcel("F4B", "300 BAY RD", "2", "OWNER B"),  # same key -> ambiguous
            parcel("F5", "400 COLLINS AVE", "1", "HOTEL LLC", dor="HOTEL OR MOTEL : HOTEL"),
            parcel("F6", "500 WEST AVE", "9", "OLD LLC"),
            *big_parcels,
        ],
        sunbiz_rows=[sunbiz("SUN LLC", "JOHN DOE")],
    )
    owners = {r["Owner name (source)"] for r in rows if r["Market"] == "miami"}
    assert owners == {"SUN LLC", "CARLOS GOMEZ", "JANE SMITH"}


def test_miami_entity_row_with_officer(tmp_path):
    rows = build_leads(
        tmp_path,
        [dbpr("SUN LLC", "100 OCEAN DR", "UNIT 5")],
        [parcel("F1", "100 OCEAN DR", "5", "SUN LLC", beds=2, baths=2)],
        sunbiz_rows=[sunbiz("SUN LLC", "JOHN DOE")],
    )
    r = by_owner(rows, "SUN LLC")
    assert r["Market"] == "miami"
    assert r["Entity"] == "SUN LLC"
    assert (r["First name"], r["Last name"]) == ("John", "Doe")
    assert r["Bedrooms"] == "2" and r["Bathrooms"] == "2"
    assert r["Phone"] == "3055551234"  # not duplicated
    assert r["Lives far?"] == "Yes"
    assert r["Ownership check"] == "Matches"
    assert r["Licence signal"] == "Self-licensed"
    assert r["Tier"] == "A"
    assert r["Units owned"] == "1"
    assert DBPR_URL in r["Source URLs"] and "county?FOLIO=F1" in r["Source URLs"]


def test_miami_individual_owner_splits_name(tmp_path):
    rows = build_leads(
        tmp_path,
        [dbpr("CARLOS GOMEZ", "200 PALM AVE", type_code="2007", city="MIAMI")],
        [
            parcel(
                "F2",
                "200 PALM AVE",
                "",
                "CARLOS GOMEZ",
                dor="RESIDENTIAL - SINGLE FAMILY",
                site_city="MIAMI",
                mail_city="HOUSTON",
            )
        ],
    )
    r = by_owner(rows, "CARLOS GOMEZ")
    assert r["Entity"] == ""
    assert (r["First name"], r["Last name"]) == ("Carlos", "Gomez")


def test_miami_licensed_to_another_party(tmp_path):
    rows = build_leads(
        tmp_path,
        [dbpr("FISHER ISLAND CLUB INC", "1 FISHER ISLAND DR", "UNIT 101")],
        [parcel("F3", "1 FISHER ISLAND DR", "101", "JANE SMITH", mail_city="MIAMI BEACH")],
    )
    r = by_owner(rows, "JANE SMITH")
    assert r["Ownership check"] == "Differs"
    assert r["Licence signal"] == "Licensed to another party"
    assert r["Current management"] == "Operator-licensed"
    assert r["Lives far?"] == "No"  # owner mailing city equals property city


def test_nashville_still_produced_and_sorted(tmp_path):
    rows = build_leads(
        tmp_path,
        [dbpr("SUN LLC", "100 OCEAN DR", "UNIT 5")],
        [parcel("F1", "100 OCEAN DR", "5", "SUN LLC")],
        nash_rows=[nash("WITHOUTLIMITS LLC")],
    )
    markets = [r["Market"] for r in rows]
    assert "miami" in markets and "nashville" in markets
    assert markets == sorted(markets)  # sorted by market first
    nrow = by_owner(rows, "WITHOUTLIMITS LLC")
    assert nrow["Market"] == "nashville" and nrow["Entity"] == "WITHOUTLIMITS LLC"


def test_empty_when_nothing_matches(tmp_path):
    rows = build_leads(
        tmp_path,
        [dbpr("HOTEL LLC", "400 COLLINS AVE", "UNIT 1")],
        [parcel("F5", "400 COLLINS AVE", "1", "HOTEL LLC", dor="HOTEL OR MOTEL : HOTEL")],
    )
    assert rows == []
