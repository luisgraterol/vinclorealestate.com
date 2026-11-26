from datetime import date, datetime

from common.paths import latest_raw_key, new_run_id, normalized_key, raw_key
from common.storage import LocalStorage
from conftest import write_raw


def test_raw_key_uses_date_partition():
    key = raw_key("job-a", date(2026, 12, 1), "120000-abc123")
    assert key == "raw/job-a/date=2026-12-01/run=120000-abc123/data.jsonl"


def test_normalized_key():
    key = normalized_key("leads", date(2026, 12, 1), "leads.csv")
    assert key == "normalized/leads/date=2026-12-01/leads.csv"


def test_run_id_sorts_by_time():
    early = new_run_id(datetime(2026, 12, 1, 6, 0, 0))
    late = new_run_id(datetime(2026, 12, 1, 18, 0, 0))
    assert early < late


def test_latest_raw_key_picks_newest_run_not_after_date(tmp_path):
    for d, run in [
        ("2026-11-24", "060000-aaaaaa"),
        ("2026-12-01", "060000-bbbbbb"),
        ("2026-12-01", "070000-cccccc"),
        ("2026-12-08", "060000-dddddd"),
    ]:
        write_raw(tmp_path, "job-a", d, run, [{"x": 1}])
    write_raw(tmp_path, "job-ab", "2026-12-01", "235959-eeeeee", [{"x": 1}])
    # una corrida fallida (parcial) más reciente no cuenta
    partial = tmp_path / "raw/job-a/date=2026-12-01/run=080000-ffffff/data.partial.jsonl"
    partial.parent.mkdir(parents=True)
    partial.write_text("{}\n")
    storage = LocalStorage(tmp_path)
    key = latest_raw_key(storage, "job-a", date(2026, 12, 1))
    assert key == "raw/job-a/date=2026-12-01/run=070000-cccccc/data.jsonl"
    assert latest_raw_key(storage, "job-a", date(2026, 1, 1)) is None
