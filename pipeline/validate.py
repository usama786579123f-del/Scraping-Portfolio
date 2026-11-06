"""Quality gate. A bad row is dropped (and counted); a bad coordinate is blanked, not trusted."""
from __future__ import annotations

from datetime import date, timedelta

from .config import GEO_LAT_TOL, GEO_LON_TOL

MAX_VALUE = 5_000_000_000


def _to_date(text):
    try:
        return date.fromisoformat(text) if text else None
    except ValueError:
        return None


def validate(permit: dict, city, today: date):
    """Returns (permit | None, drop_reason | None, warnings)."""
    p = dict(permit)
    warnings: list[str] = []

    if not p.get("permit_number"):
        return None, "no_permit_number", warnings
    issued = _to_date(p.get("issued_date"))
    if issued is None or issued.year < 2000:
        return None, "bad_date", warnings
    if issued > today + timedelta(days=1):
        return None, "future_date", warnings
    if not p.get("address"):
        return None, "no_address", warnings

    value = p.get("value")
    if value is not None and value > MAX_VALUE:
        p["value"] = None
        warnings.append("implausible_value")

    lat, lon = p.get("lat"), p.get("lon")
    if lat is not None and lon is not None:
        clat, clon = city.center
        if abs(lat - clat) > GEO_LAT_TOL or abs(lon - clon) > GEO_LON_TOL:
            p["lat"] = p["lon"] = None
            warnings.append("geo_out_of_bounds")
        else:
            p["lat"], p["lon"] = round(lat, 5), round(lon, 5)
    elif lat is not None or lon is not None:
        p["lat"] = p["lon"] = None
        warnings.append("partial_coordinates")

    return p, None, warnings
