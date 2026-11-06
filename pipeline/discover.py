"""Checks the live portals: which columns exist, and does our mapping find them?

    python -m pipeline.discover

Run this once on your own computer before the first live run. If a line shows
"--", open pipeline/config.py and add the real column name to that list.
(A "--" can also just mean the single sample row had that value empty.)
"""
from __future__ import annotations

from .config import CITIES
from .http import Client


def main() -> int:
    client = Client()
    failures = 0
    for city in CITIES.values():
        print(f"\n== {city.name}  ({city.page_url})")
        try:
            rows = client.get_json(city.api_url, {"$limit": 1})
        except Exception as exc:  # noqa: BLE001
            print(f"   FAILED to reach the portal: {exc}")
            failures += 1
            continue
        row = rows[0] if rows else {}
        print(f"   columns in a sample row ({len(row)}): {', '.join(sorted(row))}")
        for logical, candidates in city.fields.items():
            hit = [c for c in candidates if c in row]
            mark = "OK" if hit else "--"
            print(f"   {mark}  {logical:<16} -> {hit[0] if hit else 'none of ' + str(candidates)}")
        date_hit = [c for c in city.date_fields if c in row]
        print(f"   {'OK' if date_hit else '--'}  {'date column':<16} -> {date_hit[0] if date_hit else city.date_fields}")
    return 1 if failures == len(CITIES) else 0


if __name__ == "__main__":
    raise SystemExit(main())
