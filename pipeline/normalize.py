"""Turns one raw portal row into our single permit schema.

Every city names its columns differently; this is where they become the same.
"""
from __future__ import annotations

import re
from datetime import date

PLACEHOLDER_NAMES = {
    "OWNER", "SELF", "N/A", "NA", "NONE", "-", "SAME", "HOMEOWNER",
    "OWNER/BUILDER", "OWNER BUILDER", "UNKNOWN",
}
UPPER_TOKENS = {"LLC", "LLP", "LP", "PLLC", "HVAC", "USA", "II", "III", "IV", "DBA"}
DIRECTIONS = {"N", "S", "E", "W", "NE", "NW", "SE", "SW"}

CATEGORIES = (
    "new_construction", "roofing", "solar", "addition_remodel",
    "demolition", "electrical", "plumbing_hvac", "other",
)


def first(row: dict, names):
    """First candidate column that has a non-empty value."""
    for name in names:
        value = row.get(name)
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if not value:
                continue
        return value
    return None


def clean_text(value, limit: int | None = None):
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value)).strip()
    if not text:
        return None
    if limit and len(text) > limit:
        text = text[: limit - 1].rstrip() + "…"
    return text


def to_float(value):
    if value is None:
        return None
    try:
        number = float(str(value).replace(",", "").strip())
    except ValueError:
        return None
    return number if number == number else None  # reject NaN


def parse_date(value):
    if value is None:
        return None
    text = str(value).strip()
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", text)
    if m:
        y, mo, d = int(m[1]), int(m[2]), int(m[3])
    else:
        m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
        if not m:
            return None
        mo, d, y = int(m[1]), int(m[2]), int(m[3])
    try:
        return date(y, mo, d).isoformat()
    except ValueError:
        return None


def parse_money(value):
    if value is None:
        return None
    number = to_float(re.sub(r"[$\s]", "", str(value)))
    if number is None or number <= 0:  # 0 / negative means "unknown", not "free"
        return None
    return round(number, 2)


def smart_title(text: str | None):
    """'8015 28TH AVE NE' -> '8015 28th Ave NE'."""
    text = clean_text(text)
    if not text:
        return None
    out = []
    for token in text.split(" "):
        if token.upper() in DIRECTIONS:
            out.append(token.upper())
        else:
            out.append(token.title())
    return re.sub(r"(?<=\d)(St|Nd|Rd|Th)\b", lambda m: m.group(1).lower(), " ".join(out))


def clean_company(name) -> str | None:
    text = clean_text(name)
    if not text or len(text) < 2 or text.upper() in PLACEHOLDER_NAMES:
        return None
    if text.isupper() or text.islower():
        tokens = []
        for token in text.split(" "):
            core = token.strip(".,()").upper()
            tokens.append(token.upper() if core in UPPER_TOKENS else token.title())
        text = " ".join(tokens)
    return text


def pretty_type(value) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    text = re.sub(r"^PERMIT\s*-\s*", "", text, flags=re.I)
    return text.title() if text.isupper() or text.islower() else text


def parse_location(loc):
    if loc is None:
        return None, None
    if isinstance(loc, dict):
        coords = loc.get("coordinates")
        if isinstance(coords, (list, tuple)) and len(coords) >= 2:
            return to_float(coords[1]), to_float(coords[0])  # GeoJSON is [lon, lat]
        return to_float(loc.get("latitude")), to_float(loc.get("longitude"))
    if isinstance(loc, str):
        m = re.search(r"POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)", loc, re.I)
        if m:
            return float(m[2]), float(m[1])
    return None, None


def extract_latlon(city, row):
    fields = city.fields
    lat = to_float(first(row, fields.get("lat", ())))
    lon = to_float(first(row, fields.get("lon", ())))
    if lat is None or lon is None:
        lat, lon = parse_location(first(row, fields.get("location", ())))
    return lat, lon


def format_address(city, row):
    fields = city.fields
    full = first(row, fields.get("full_address", ()))
    if full:
        return smart_title(str(full))
    parts = [first(row, fields.get(k, ()))
             for k in ("street_number", "street_direction", "street_name", "street_suffix")]
    return smart_title(" ".join(str(p) for p in parts if p))


def extract_contractor(city, row):
    for type_col, name_col in city.contractor_fields:
        name = first(row, (name_col,))
        if not name:
            continue
        if type_col is not None:
            kind = str(first(row, (type_col,)) or "").upper()
            if "CONTRACTOR" not in kind:  # skip owners, applicants, architects...
                continue
        company = clean_company(name)
        if company:
            return company
    return None


_TYPE_RULES = (
    ("demolition", r"demoli|wreck"),
    ("new_construction", r"\bnew\b"),
)
_TEXT_RULES = (
    ("solar", r"\bsolar\b|photovoltaic|\bpv\b"),
    ("roofing", r"\bre-?roof|\broof"),
    ("addition_remodel", r"addition|alteration|remodel|renovat|repair|rehab|tenant improvement|interior|kitchen|bath"),
    ("electrical", r"electric"),
    ("plumbing_hvac", r"plumb|mechanical|hvac|furnace|boiler|heating|air condition"),
)


def classify(type_text, description) -> str:
    """Permit *type* decides new construction/demolition (descriptions of new
    buildings often mention roofs); everything else is read from type + text."""
    type_l = (type_text or "").lower()
    for category, pattern in _TYPE_RULES:
        if re.search(pattern, type_l):
            return category
    text = f"{type_l} {(description or '').lower()}"
    for category, pattern in _TEXT_RULES:
        if re.search(pattern, text):
            return category
    return "other"


def normalize(city, row: dict, date_field: str) -> dict:
    fields = city.fields
    number = first(row, fields.get("permit_number", ()))
    type_raw = clean_text(first(row, fields.get("type", ())))
    description = clean_text(first(row, fields.get("description", ())), 280)
    lat, lon = extract_latlon(city, row)
    zip_raw = first(row, fields.get("zip", ()))
    zip_match = re.match(r"\d{5}", str(zip_raw)) if zip_raw else None
    return {
        "id": f"{city.key}:{str(number).strip()}" if number else None,
        "city": city.name,
        "state": city.state,
        "permit_number": str(number).strip() if number else None,
        "type": pretty_type(type_raw),
        "category": classify(type_raw, description),
        "description": description,
        "address": format_address(city, row),
        "zip": zip_match.group(0) if zip_match else None,
        "issued_date": parse_date(first(row, (date_field,))),
        "value": parse_money(first(row, fields.get("value", ()))),
        "contractor": extract_contractor(city, row),
        "lat": lat,
        "lon": lon,
        "source_url": city.page_url,
    }
