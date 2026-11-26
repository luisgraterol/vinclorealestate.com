from datetime import date

from common.jsonl import read_records
from common.storage import LocalStorage
from conftest import FakeResponse
from tasks.web_extractor import main as cli
from tasks.web_extractor.jobs.dbpr_fl_lodging import DbprFlLodging, decode
from tasks.web_extractor.jobs.nashville_str_permits import PAGE_SIZE, NashvilleStrPermits
from tasks.web_extractor.registry import all_jobs


def test_jobs_are_registered():
    assert {"nashville-str-permits", "dbpr-fl-lodging"} <= set(all_jobs())


def test_nashville_paginates_until_no_more(fake_context_factory):
    pages = [
        {
            "features": [{"attributes": {"Permit__": str(i)}} for i in range(PAGE_SIZE)],
            "exceededTransferLimit": True,
        },
        {"features": [{"attributes": {"Permit__": "last"}}]},
    ]
    ctx, _ = fake_context_factory(lambda url, params: FakeResponse(pages.pop(0)))
    items = list(NashvilleStrPermits().extract(ctx))
    assert len(items) == PAGE_SIZE + 1
    assert [p["resultOffset"] for _, p in ctx.calls] == [0, PAGE_SIZE]
    assert "Permit__%3D%27last%27" in items[-1].source_url


def test_nashville_raises_on_arcgis_error(fake_context_factory):
    ctx, _ = fake_context_factory(lambda url, params: FakeResponse({"error": {"code": 400}}))
    try:
        list(NashvilleStrPermits().extract(ctx))
    except RuntimeError as exc:
        assert "ArcGIS" in str(exc)
    else:
        raise AssertionError("debió fallar")


def test_dbpr_parses_csv(fake_context_factory):
    csv_bytes = '"License Type Code","Licensee Name"\n"2006","PEÑA LLC"\n'.encode("cp1252")
    ctx, _ = fake_context_factory(lambda url, params: FakeResponse(body=csv_bytes))
    items = list(DbprFlLodging().extract(ctx))
    assert items[0].data == {"License Type Code": "2006", "Licensee Name": "PEÑA LLC"}
    assert items[0].source_url.endswith("hrlodge1.csv")


def test_decode_prefers_utf8():
    assert decode("ñ".encode()) == "ñ"


def test_run_writes_raw_file(tmp_path, fake_context_factory):
    page = {"features": [{"attributes": {"Permit__": "1"}}]}
    _, factory = fake_context_factory(lambda url, params: FakeResponse(page))
    code = cli.run("nashville-str-permits", str(tmp_path), date(2026, 12, 1), factory)
    assert code == 0
    [key] = LocalStorage(tmp_path).list_keys("raw/nashville-str-permits/date=2026-12-01/")
    assert next(read_records(LocalStorage(tmp_path), key))["data"] == {"Permit__": "1"}


def test_run_fails_when_job_returns_nothing(tmp_path, fake_context_factory):
    _, factory = fake_context_factory(lambda url, params: FakeResponse({"features": []}))
    assert cli.run("nashville-str-permits", str(tmp_path), date(2026, 12, 1), factory) == 2
