"""Detect company names and build a stable key for matching them across sources.

DBPR, the county and Sunbiz spell the same LLC slightly differently ("SUN LLC", "SUN, L.L.C.").
`entity_key` collapses those into one comparable string so the sources can be joined by name.
"""

from __future__ import annotations

import re

_ENTITY = re.compile(
    r"\b(LLC|L\.?L\.?C|INC|CORP|CORPORATION|CO|COMPANY|LTD|LP|LLP|PLLC|TRUST|TR|TRUSTEE|"
    r"PARTNERS|PARTNERSHIP|HOLDINGS|PROPERTIES|INVESTMENTS|GROUP|ENTERPRISES|VENTURES|"
    r"ASSOCIATION|ASSN|REALTY|MANAGEMENT|CAPITAL)\b\.?",
    re.IGNORECASE,
)
# Tokens dropped when building the match key: legal suffixes and noise that vary by source.
_SUFFIX_TOKENS = {
    "LLC",
    "LLLC",
    "LC",
    "INC",
    "CORP",
    "CORPORATION",
    "CO",
    "COMPANY",
    "LTD",
    "LP",
    "LLP",
    "PLLC",
    "THE",
    "A",
    "AN",
    "OF",
    "AND",
}
_NON_ALNUM = re.compile(r"[^A-Z0-9 ]+")
_WS = re.compile(r"\s+")


def looks_like_entity(name: str | None) -> bool:
    """True when the name reads as a company rather than a person."""
    return bool(name) and bool(_ENTITY.search(name))


def entity_key(name: str | None) -> str:
    """Normalized, suffix-stripped key for matching the same entity across sources."""
    if not name:
        return ""
    # Drop periods first so dotted suffixes collapse ("L.L.C." -> "LLC") before tokenizing.
    cleaned = _NON_ALNUM.sub(" ", name.upper().replace(".", ""))
    tokens = [t for t in _WS.sub(" ", cleaned).split() if t not in _SUFFIX_TOKENS]
    return " ".join(tokens)
