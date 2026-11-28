import json
from contextlib import contextmanager

import pytest


class FakeResponse:
    def __init__(self, payload=None, body: bytes = b"", status: int = 200):
        self._payload = payload
        self._body = body
        self.status = status
        self.ok = 200 <= status < 300

    def json(self):
        return self._payload

    def body(self):
        return self._body


class FakeContext:
    """Stands in for JobContext: answers get/post from a handler, no network or browser.

    `raw` optionally maps a job name to the records `read_latest_raw` should return, so jobs
    that enrich a previous job's output can be tested without real storage.
    """

    def __init__(self, handler, raw=None):
        self.handler = handler
        self.raw = raw or {}
        self.calls = []
        self.upstream = None
        self.run_date = None

    def get(self, url, *, params=None, **_):
        self.calls.append((url, params))
        return self.handler(url, params)

    def post(self, url, *, form=None, **_):
        self.calls.append((url, form))
        return self.handler(url, form)

    def read_latest_raw(self, job_name):
        yield from self.raw.get(job_name, [])


@pytest.fixture
def fake_context_factory():
    def make(handler, raw=None):
        ctx = FakeContext(handler, raw)

        @contextmanager
        def factory():
            yield ctx

        return ctx, factory

    return make


def write_raw(root, job, run_date, run_id, records):
    path = root / f"raw/{job}/date={run_date}/run={run_id}/data.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(r) + "\n" for r in records))
    return path
