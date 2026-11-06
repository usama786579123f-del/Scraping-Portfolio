"""Portals sometimes list the same permit twice. Keep the most complete copy."""
from __future__ import annotations

_OPTIONAL = ("description", "address", "zip", "value", "contractor", "lat", "lon")


def completeness(permit: dict) -> int:
    return sum(1 for key in _OPTIONAL if permit.get(key) not in (None, ""))


def dedupe(permits):
    best: dict[str, dict] = {}
    duplicates = 0
    for p in permits:
        key = p["id"]
        current = best.get(key)
        if current is None:
            best[key] = p
            continue
        duplicates += 1
        if (completeness(p), p["issued_date"]) > (completeness(current), current["issued_date"]):
            best[key] = p
    return list(best.values()), duplicates
