"""Contrato de los jobs de extracción y el contexto de Playwright que reciben."""

from __future__ import annotations

import logging
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, ClassVar, Protocol

from playwright.sync_api import APIRequestContext, Browser, Page, Playwright, sync_playwright

log = logging.getLogger(__name__)

USER_AGENT = "vinclo-srv/0.1 (+https://vinclorealestate.com)"


@dataclass(frozen=True)
class Item:
    """Un registro extraído: el link exacto de donde salió y los datos tal cual."""

    source_url: str
    data: dict[str, Any]


class JobContext:
    """Da a cada job un cliente HTTP y, si lo pide, un navegador (se lanza solo si se usa)."""

    def __init__(self, playwright: Playwright, request: APIRequestContext) -> None:
        self._playwright = playwright
        self.request = request
        self._browser: Browser | None = None

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
        """GET con reintentos y espera exponencial ante errores de red o 5xx."""
        for attempt in range(1, retries + 1):
            try:
                resp = self.request.get(url, params=params, timeout=timeout_ms)
                if resp.ok:
                    return resp
                if resp.status < 500:
                    raise RuntimeError(f"GET {url} → HTTP {resp.status}")
                error: Exception = RuntimeError(f"GET {url} → HTTP {resp.status}")
            except RuntimeError:
                raise
            except Exception as exc:  # errores de red de Playwright
                error = exc
            if attempt == retries:
                raise error
            wait = 2**attempt
            log.warning("intento %d/%d falló (%s); reintento en %ds", attempt, retries, error, wait)
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
