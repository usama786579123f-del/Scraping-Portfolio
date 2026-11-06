"""Small helpers that describe a set of permits (used for the page's trust panel)."""
from __future__ import annotations


def _has_coords(p) -> bool:
    return p.get("lat") is not None and p.get("lon") is not None


def coverage(rows) -> dict:
    n = len(rows) or 1
    return {
        "coordinates": round(sum(1 for r in rows if _has_coords(r)) / n, 3),
        "value": round(sum(1 for r in rows if r.get("value") is not None) / n, 3),
        "contractor": round(sum(1 for r in rows if r.get("contractor")) / n, 3),
    }


def totals(rows) -> dict:
    return {
        "permits": len(rows),
        "with_coordinates": sum(1 for r in rows if _has_coords(r)),
        "with_value": sum(1 for r in rows if r.get("value") is not None),
        "with_contractor": sum(1 for r in rows if r.get("contractor")),
    }


def latest(rows):
    dates = [r["issued_date"] for r in rows if r.get("issued_date")]
    return max(dates) if dates else None
