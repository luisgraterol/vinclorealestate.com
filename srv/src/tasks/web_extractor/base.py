"""Contract for extraction jobs and the Playwright context they receive."""

from __future__ import annotations

import logging
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date
from typing import Any, ClassVar, Protocol

from playwright.sync_api import APIRequestContext, Browser, Page, Playwright, sync_playwright

from common.jsonl import read_records
from common.paths import latest_raw_key
from common.storage import Storage

log = logging.getLogger(__name__)

USER_AGENT = "vinclo-srv/0.1 (+https://vinclorealestate.com)"


@dataclass(frozen=True)
class Item:
    """An extracted record: the exact link it came from and the data as-is."""

    source_url: str
    data: dict[str, Any]


class JobContext:
    """Gives each job an HTTP client and, if requested, a browser (launched only if used)."""

    def __init__(self, playwright: Playwright, request: APIRequestContext) -> None:
        self._playwright = playwright
        self.request = request
        self._browser: Browser | None = None
        # Set by run() before extract(): let a job read a prior job's raw output from upstream
        # (e.g. miami-dade-parcels queries the county only for the addresses DBPR already listed).
        self.upstream: Storage | None = None
        self.run_date: date | None = None

    def read_latest_raw(self, job_name: str) -> Iterator[dict]:
        """Records from the most recent run of `job_name` in upstream (on or before run_date)."""
        if self.upstream is None or self.run_date is None:
            raise RuntimeError("this job needs upstream; run it with --upstream")
        key = latest_raw_key(self.upstream, job_name, self.run_date)
        if key is None:
            raise RuntimeError(f"no raw found for '{job_name}' in {self.upstream.uri}")
        yield from read_records(self.upstream, key)

    def new_page(self) -> Page:
        if self._browser is None:
            self._browser = self._playwright.chromium.launch(headless=True)
        return self._browser.new_page(user_agent=USER_AGENT)

    def get(
        self,
        url: str,
        *,
        params: dict[str, Any] | None = None,
        retries: int = 3,
        timeout_ms: int = 120_000,
    ):
        """GET with retries and exponential backoff on network errors or 5xx."""
        return self._send("GET", url, params=params, retries=retries, timeout_ms=timeout_ms)

    def post(
        self,
        url: str,
        *,
        form: dict[str, Any],
        retries: int = 3,
        timeout_ms: int = 120_000,
    ):
        """Form-encoded POST; use it when a GET query string would be too long."""
        return self._send("POST", url, form=form, retries=retries, timeout_ms=timeout_ms)

    def _send(
        self,
        method: str,
        url: str,
        *,
        params: dict[str, Any] | None = None,
        form: dict[str, Any] | None = None,
        retries: int,
        timeout_ms: int,
    ):
        for attempt in range(1, retries + 1):
            try:
                if method == "POST":
                    resp = self.request.post(url, form=form, timeout=timeout_ms)
                else:
                    resp = self.request.get(url, params=params, timeout=timeout_ms)
                if resp.ok:
                    return resp
                if resp.status < 500:
                    raise RuntimeError(f"{method} {url} → HTTP {resp.status}")
                error: Exception = RuntimeError(f"{method} {url} → HTTP {resp.status}")
            except RuntimeError:
                raise
            except Exception as exc:  # Playwright network errors
                error = exc
            if attempt == retries:
                raise error
            wait = 2**attempt
            log.warning("attempt %d/%d failed (%s); retrying in %ds", attempt, retries, error, wait)
            time.sleep(wait)
        raise AssertionError("unreachable")

    def close(self) -> None:
        if self._browser is not None:
            self._browser.close()


@contextmanager
def job_context() -> Iterator[JobContext]:
    with sync_playwright() as pw:
        request = pw.request.new_context(extra_http_headers={"User-Agent": USER_AGENT})
        ctx = JobContext(pw, request)
        try:
            yield ctx
        finally:
            ctx.close()
            request.dispose()


class Job(Protocol):
    name: ClassVar[str]
    description: ClassVar[str]

    def extract(self, ctx: JobContext) -> Iterator[Item]: ...
