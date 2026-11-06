"""Generates clearly-labelled DEMO permits so the site works before the first live run.

Everything here is invented: street names, contractors and numbers are fictional,
and the published status.json says mode = "sample" so the page shows a Demo banner.
"""
from __future__ import annotations

import random
from datetime import date, timedelta

from .config import CITIES

STREETS = ["Oakridge Way", "Pinecrest Ave", "Maple Ln", "Cedar Blvd", "Birch Way", "Willow St",
           "Aspen Dr", "Elmwood Ave", "Harbor Rd", "Lakeview Ct", "Summit St", "Ridge Rd"]
CONTRACTORS = ["BuildWell Co.", "Summit Roofing", "Bright Solar Co.", "Prime Builders",
               "Northgate Electric", "Harbor HVAC", "Cedar & Stone Construction",
               "Keystone Remodeling", "Blue Fern Contractors", "Granite Peak Builders",
               "Clearwater Plumbing", "Redwood Renovations"]

# category -> (permit type label, descriptions, value range)
KINDS = {
    "new_construction": ("New Construction", ["New 2-story single-family home", "New 4-unit townhouse building"], (250_000, 900_000)),
    "roofing": ("Roofing", ["Tear off and replace asphalt shingle roof", "Re-roof existing building"], (8_000, 32_000)),
    "solar": ("Solar", ["Install rooftop solar panel system", "Residential photovoltaic array"], (12_000, 38_000)),
    "addition_remodel": ("Addition / Alteration", ["Kitchen and bath remodel", "Rear addition and interior alterations"], (30_000, 220_000)),
    "demolition": ("Demolition", ["Demolish detached garage"], (5_000, 40_000)),
    "electrical": ("Electrical", ["Service panel upgrade"], (2_500, 15_000)),
    "plumbing_hvac": ("Plumbing / HVAC", ["Replace furnace and ductwork"], (4_000, 25_000)),
    "other": ("Other", ["Minor interior work"], (1_500, 12_000)),
}
WEIGHTS = {"new_construction": 12, "roofing": 22, "solar": 14, "addition_remodel": 26,
           "demolition": 4, "electrical": 9, "plumbing_hvac": 9, "other": 4}
COUNTS = {"chicago": 260, "seattle": 190, "san-francisco": 150}


def generate(today: date, seed: int = 7) -> list[dict]:
    rng = random.Random(seed)
    categories = list(WEIGHTS)
    weights = list(WEIGHTS.values())
    rows: list[dict] = []
    for key, count in COUNTS.items():
        city = CITIES[key]
        clat, clon = city.center
        for i in range(count):
            category = rng.choices(categories, weights)[0]
            label, descriptions, (low, high) = KINDS[category]
            offset = int(rng.triangular(0, 59, 0))  # more permits in recent days
            number = f"DEMO-{key[:3].upper()}-{i + 1:05d}"
            has_geo = rng.random() > 0.03
            rows.append({
                "id": f"{key}:{number}",
                "city": city.name,
                "state": city.state,
                "permit_number": number,
                "type": label,
                "category": category,
                "description": rng.choice(descriptions),
                "address": f"{rng.randint(100, 9999)} {rng.choice(STREETS)}",
                "zip": None,
                "issued_date": (today - timedelta(days=offset)).isoformat(),
                "value": round(rng.uniform(low, high), -2),
                "contractor": None if rng.random() < 0.15 else rng.choice(CONTRACTORS),
                "lat": round(clat + rng.gauss(0, 0.03), 5) if has_geo else None,
                "lon": round(clon + rng.gauss(0, 0.04), 5) if has_geo else None,
                "source_url": None,
            })
    rows.sort(key=lambda r: r["issued_date"], reverse=True)
    return rows
