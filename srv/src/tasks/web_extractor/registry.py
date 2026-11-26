"""Registro de jobs disponibles para `web-extractor --job <nombre>`."""

from __future__ import annotations

from tasks.web_extractor.base import Job

JOBS: dict[str, type[Job]] = {}


def register(cls: type[Job]) -> type[Job]:
    if cls.name in JOBS:
        raise ValueError(f"job duplicado: {cls.name}")
    JOBS[cls.name] = cls
    return cls


def get_job(name: str) -> Job:
    import tasks.web_extractor.jobs  # noqa: F401  (registra los jobs)

    try:
        return JOBS[name]()
    except KeyError:
        available = ", ".join(sorted(JOBS))
        raise SystemExit(f"job desconocido: {name}. Disponibles: {available}") from None


def all_jobs() -> dict[str, type[Job]]:
    import tasks.web_extractor.jobs  # noqa: F401

    return dict(sorted(JOBS.items()))
