from datetime import date

import pyarrow.parquet as pq

from common.storage import LocalStorage
from conftest import write_raw
from tasks.normalize import main as cli

RUN = date(2026, 12, 1)


def _seed(up):
    write_raw(
        up,
        "dbpr-fl-lodging",
        RUN,
        "060000-a",
        [
            {
                "source_url": "dbpr",
                "data": {
                    "License Type Code": "2006",
                    "Licensee Name": "SUN LLC",
                    "Location County": "Dade",
                    "Location Street Address": "100 OCEAN DR",
                    "Location Address Line 2": "UNIT 5",
                    "Location City": "MIAMI BEACH",
                    "Location Zip Code": "33139",
                    "License Expiry Date": "12/31/2030",
                    "Primary Phone Number": "3055551234",
                    "Secondary Phone Number": "",
                },
            }
        ],
    )
    write_raw(
        up,
        "miami-dade-parcels",
        RUN,
        "060000-b",
        [
            {
                "source_url": "county",
                "data": {
                    "FOLIO": "F1",
                    "TRUE_SITE_ADDR_NO_UNIT": "100 OCEAN DR",
                    "TRUE_SITE_UNIT": "5",
                    "TRUE_SITE_CITY": "MIAMI BEACH",
                    "TRUE_SITE_ZIP_CODE": "33139",
                    "TRUE_MAILING_CITY": "NEW YORK",
                    "TRUE_MAILING_STATE": "NY",
                    "TRUE_OWNER1": "SUN LLC",
                    "BEDROOM_COUNT": 2,
                    "BATHROOM_COUNT": 2,
                    "HALF_BATHROOM_COUNT": 0,
                    "DOR_DESC": "RESIDENTIAL - CONDOMINIUM",
                },
            }
        ],
    )


def test_run_writes_parquet_and_csv(tmp_path):
    up, down = tmp_path / "up", tmp_path / "down"
    _seed(up)
    code = cli.run("leads", str(up), str(down), RUN)
    assert code == 0

    parquet = down / "athena/leads/date=2026-12-01/leads.parquet"
    csv = down / "exports/leads/date=2026-12-01/leads.csv"
    assert parquet.exists() and csv.exists()

    table = pq.read_table(parquet)
    assert table.num_rows == 1
    assert table.column("Entity")[0].as_py() == "SUN LLC"
    assert table.column("Market")[0].as_py() == "miami"


def test_run_returns_2_when_empty(tmp_path):
    up, down = tmp_path / "up", tmp_path / "down"
    write_raw(up, "dbpr-fl-lodging", RUN, "060000-a", [])
    assert cli.run("leads", str(up), str(down), RUN) == 2


def test_unknown_dataset(tmp_path):
    import pytest

    with pytest.raises(SystemExit):
        cli.run("nope", str(tmp_path), str(tmp_path), RUN)


def test_storage_from_uri_round_trips_local(tmp_path):
    s = LocalStorage(tmp_path)
    assert s.uri == str(tmp_path)
