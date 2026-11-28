"""Address normalization for joining DBPR to the Miami-Dade parcel roll.

The `miami-dade-parcels` job and the `leads` dataset must build the SAME key, so the logic
lives here and is not duplicated.
"""

from __future__ import annotations

import re

_WS = re.compile(r"\s+")
_PUNCT = re.compile(r"[.,#]+")
# Abbreviations DBPR and the county spell differently.
_SUFFIX = {
    "STREET": "ST",
    "STR": "ST",
    "AVENUE": "AVE",
    "AV": "AVE",
    "ROAD": "RD",
    "DRIVE": "DR",
    "COURT": "CT",
    "BOULEVARD": "BLVD",
    "BLV": "BLVD",
    "LANE": "LN",
    "PLACE": "PL",
    "TERRACE": "TER",
    "TERR": "TER",
    "CIRCLE": "CIR",
    "PARKWAY": "PKWY",
    "HIGHWAY": "HWY",
    "TRAIL": "TRL",
    "WAY": "WAY",
}
_DIR = {
    "NORTH": "N",
    "SOUTH": "S",
    "EAST": "E",
    "WEST": "W",
    "NORTHEAST": "NE",
    "NORTHWEST": "NW",
    "SOUTHEAST": "SE",
    "SOUTHWEST": "SW",
}
_UNIT_WORDS = re.compile(r"\b(UNIT|APT|APARTMENT|STE|SUITE|NO|NUM|NUMBER|#)\b")


def norm_street(value: str | None) -> str:
    """Street without unit, canonical form: uppercase, abbreviated suffixes and directions."""
    if not value:
        return ""
    text = _PUNCT.sub(" ", value.upper())
    tokens = [_DIR.get(t, _SUFFIX.get(t, t)) for t in _WS.sub(" ", text).split()]
    return " ".join(tokens).strip()


def norm_unit(value: str | None) -> str:
    """Unit in canonical form: just the identifier, without the word 'UNIT'/'APT'/'#'.

    DBPR gives 'UNIT 101'; the county gives '101'. Both become '101'.
    """
    if not value:
        return ""
    text = _UNIT_WORDS.sub(" ", value.upper().replace("#", " "))
    return re.sub(r"[^A-Z0-9]", "", text)


def norm_city(value: str | None) -> str:
    return _WS.sub(" ", (value or "").upper()).strip()
