import csv
from datetime import date

from conftest import write_raw
from tasks.normalize import main as cli
from tasks.normalize.datasets.leads import COLUMNS, is_entity

RUN = date(2026, 12, 1)


def dbpr(
    name,
    city="MIAMI",
    mailing_city="NEW YORK",
    mailing_state="NY",
    units="1",
    type_code="2006",
    county="Dade",
    expiry="10/01/2027",
    street="100 OCEAN DR",
):
    return {
        "source_url": "https://www2.myfloridalicense.com/sto/file_download/extracts/hrlodge1.csv",
        "data": {
            "License Type Code": type_code,
            "Licensee Name": name,
            "Mailing Name": "",
            "Mailing Street Address": "1 MAIN ST",
            "Mailing City": mailing_city,
            "Mailing State Code": mailing_state,
            "Mailing Zip Code": "10001",
            "Location Street Address": street,
            "Location City": city,
            "Location State Code": "FL",
            "Location Zip Code": "331394209",
            "Location County": county,
            "License Expiry Date": expiry,
            "Number of Seats or Rental Units": units,
        },
    }


def nash(owner, subtype="CAZ10A003", status="ISSUED", owner_city="ATLANTA", owner_state="GA"):
    return {
        "source_url": "https://services2.arcgis.com/x/query?where=Permit__%3D%271%27",
        "data": {
            "Permit__": "1",
            "Permit_Status": status,
            "Permit_SubType": subtype,
            "Expiration_Date": 1807056000000,
            "Permit_Owner_Name": owner,
            "Permit_Owner_Addr1": None,
            "Permit_Owner_Addr2": "5 PEACH ST",
            "Permit_Owner_City": owner_city,
            "Permit_Owner_State": owner_state,
            "Permit_Owner_Zip": "30301",
            "Address": "1029 DELMAS AVE",
            "City": "NASHVILLE",
            "State": "TN",
            "ZIP": "37216",
        },
    }


def build(tmp_path, dbpr_records, nash_records):
    up, down = tmp_path / "up", tmp_path / "down"
    write_raw(up, "dbpr-fl-lodging", RUN, "060000-aaaaaa", dbpr_records)
    write_raw(up, "nashville-str-permits", RUN, "060000-bbbbbb", nash_records)
    code = cli.run("leads", str(up), str(down), RUN)
    path = down / f"normalized/leads/date={RUN}/leads.csv"
    rows = list(csv.DictReader(path.open())) if path.exists() else []
    return code, rows


def test_leads_applies_spec_filters(tmp_path):
    code, rows = build(
        tmp_path,
        [
            dbpr("SUN LLC"),  # entra
            dbpr("LOCAL OWNER", mailing_city="MIAMI", mailing_state="FL"),  # vive cerca
            dbpr("BIG CO LLC", units="6"),  # > 5 unidades
            dbpr("HOTEL INC", type_code="2001"),  # no es vacation rental
            dbpr("KEYS LLC", county="Monroe"),  # fuera de Miami-Dade
            dbpr("OLD LLC", expiry="10/01/2026"),  # licencia vencida
        ],
        [
            nash("SMITH, JOHN"),  # entra
            nash("HOME, OWNER", subtype="CAZ10A001"),  # owner occupied
            nash("DENIED, X", status="DENIED-D"),  # no emitido
        ],
    )
    assert code == 0
    assert [(r["Market"], r["Owner name (source)"]) for r in rows] == [
        ("miami", "SUN LLC"),
        ("nashville", "SMITH, JOHN"),
    ]
    miami, nashville = rows
    assert list(miami) == COLUMNS
    assert miami["Entity"] == "SUN LLC"
    assert miami["Property"] == "100 OCEAN DR MIAMI FL 33139"
    assert miami["Lives far?"] == "Yes"
    assert miami["Lead source detail"] == "DBPR Miami-Dade"
    assert miami["Date added"] == "2026-12-01"
    assert miami["First name"] == miami["Email"] == miami["Tier"] == ""  # nada inventado
    assert nashville["Entity"] == ""
    assert nashville["Property"] == "1029 DELMAS AVE NASHVILLE TN 37216"
    assert nashville["Mailing address"] == "5 PEACH ST ATLANTA GA 30301"


def test_units_are_summed_per_owner(tmp_path):
    _, rows = build(tmp_path, [dbpr("TWO LLC", units="3", street=f"{n} A ST") for n in (1, 2)], [])
    assert rows == []  # 3 + 3 = 6 unidades: se descarta


def test_empty_dataset_fails(tmp_path):
    code, rows = build(tmp_path, [dbpr("HOTEL INC", type_code="2001")], [])
    assert (code, rows) == (2, [])


def test_is_entity():
    assert is_entity("WITHOUTLIMITSBIZ, LLC")
    assert is_entity("SMITH FAMILY TRUST")
    assert not is_entity("CLAUER, JAMES & BARLOWE, KRISTIN")
