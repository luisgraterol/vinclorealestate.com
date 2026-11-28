import boto3
import pytest
from moto import mock_aws

from common.jsonl import RawWriter, read_records
from common.storage import LocalStorage, S3Storage, storage_from_uri


def test_storage_from_uri():
    assert isinstance(storage_from_uri("s3://vinclo-upstream"), S3Storage)
    assert isinstance(storage_from_uri("./out"), LocalStorage)
    assert isinstance(storage_from_uri("file:///tmp/out"), LocalStorage)
    with pytest.raises(ValueError):
        storage_from_uri("s3://vinclo-upstream/raw")


def test_writer_roundtrip_local(tmp_path):
    storage = LocalStorage(tmp_path)
    with RawWriter(storage, "raw/j/date=2026-12-01/run=1/data.jsonl", "j", "1") as w:
        w.write("https://example.org/a", {"name": "Ñandú", "n": 1})
        w.write("https://example.org/b", {"name": "b", "n": 2})
    records = list(read_records(storage, "raw/j/date=2026-12-01/run=1/data.jsonl"))
    assert [r["data"]["n"] for r in records] == [1, 2]
    assert records[0]["data"]["name"] == "Ñandú"
    assert set(records[0]) == {"job", "run_id", "extracted_at", "source_url", "data"}


def test_writer_uploads_partial_data_on_failure(tmp_path):
    storage = LocalStorage(tmp_path)
    key = "raw/j/date=2026-12-01/run=1/data.jsonl"
    with pytest.raises(RuntimeError), RawWriter(storage, key, "j", "1") as w:
        w.write("u", {"n": 1})
        raise RuntimeError("source failed")
    partial = "raw/j/date=2026-12-01/run=1/data.partial.jsonl"
    assert storage.list_keys("raw/") == [partial]
    assert len(list(read_records(storage, partial))) == 1


def test_writer_skips_upload_when_empty(tmp_path):
    storage = LocalStorage(tmp_path)
    with RawWriter(storage, "raw/j/x/data.jsonl", "j", "1") as w:
        pass
    assert w.uri is None
    assert storage.list_keys("raw/") == []


@mock_aws
def test_s3_storage_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    boto3.client("s3").create_bucket(Bucket="vinclo-upstream")
    storage = S3Storage("vinclo-upstream")
    with RawWriter(storage, "raw/j/date=2026-12-01/run=1/data.jsonl", "j", "1") as w:
        w.write("u", {"n": 1})
    assert w.uri == "s3://vinclo-upstream/raw/j/date=2026-12-01/run=1/data.jsonl"
    assert storage.list_keys("raw/j/") == ["raw/j/date=2026-12-01/run=1/data.jsonl"]
    assert next(read_records(storage, "raw/j/date=2026-12-01/run=1/data.jsonl"))["data"] == {"n": 1}
