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
    """Imita JobContext: responde GETs desde una función, sin red ni navegador."""

    def __init__(self, handler):
        self.handler = handler
        self.calls = []

    def get(self, url, *, params=None, **_):
        self.calls.append((url, params))
        return self.handler(url, params)


@pytest.fixture
def fake_context_factory():
    def make(handler):
        ctx = FakeContext(handler)

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
