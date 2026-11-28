"""Registry of datasets available for `normalize --dataset <name>`."""

from __future__ import annotations

from collections.abc import Callable
from datetime import date

from common.storage import Storage

# A dataset receives the upstream storage and the date, and returns (columns, rows).
Builder = Callable[[Storage, date], tuple[list[str], list[dict[str, str]]]]
DATASETS: dict[str, Builder] = {}


def register(name: str) -> Callable[[Builder], Builder]:
    def decorator(fn: Builder) -> Builder:
        if name in DATASETS:
            raise ValueError(f"dataset duplicado: {name}")
        DATASETS[name] = fn
        return fn

    return decorator


def all_datasets() -> dict[str, Builder]:
    import tasks.normalize.datasets  # noqa: F401  (registers the datasets)

    return dict(sorted(DATASETS.items()))
