"""Registro de datasets disponibles para `normalize --dataset <nombre>`."""

from __future__ import annotations

from collections.abc import Callable
from datetime import date

from common.storage import Storage

# Un dataset recibe el storage de upstream y la fecha, y devuelve (columnas, filas).
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
    import tasks.normalize.datasets  # noqa: F401  (registra los datasets)

    return dict(sorted(DATASETS.items()))
