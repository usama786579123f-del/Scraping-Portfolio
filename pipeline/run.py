"""Daily pipeline: fetch -> normalize -> validate -> dedupe -> publish JSON.

    python -m pipeline.run             # live data from the city portals
    python -m pipeline.run --sample    # generated demo data (no network needed)

Design rules:
  * one broken city never takes the others down
  * if a city fails, its previous rows are kept and marked "stale"
  * never overwrite good published data with an empty result
  * exit code 1 if no city worked, so GitHub Actions turns red and emails you
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path

from .adapters.socrata import SocrataAdapter
from .config import CITIES, DAYS, MAX_ROWS_PER_CITY, MIN_ROWS_OK
from .dedupe import dedupe
from .http import Client
from .make_sample import generate
from .normalize import normalize
from .report import coverage, latest, totals
from .validate import validate

DEFAULT_OUT = Path(__file__).resolve().parent.parent / "public" / "data"


def _write_json(path: Path, obj, pretty: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        if pretty:
            json.dump(obj, fh, ensure_ascii=False, indent=2)
        else:
            json.dump(obj, fh, ensure_ascii=False, separators=(",", ":"))
    os.chmod(tmp, 0o644)  # mkstemp creates 0600; published files should be readable
    os.replace(tmp, path)  # atomic: readers never see a half-written file


def load_previous(out_dir: Path) -> dict[str, list]:
    """Previously published LIVE rows by city name (used as a stale fallback)."""
    try:
        status = json.loads((out_dir / "status.json").read_text(encoding="utf-8"))
        if status.get("mode") != "live":
            return {}
        rows = json.loads((out_dir / "permits.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    grouped: dict[str, list] = {}
    for row in rows:
        grouped.setdefault(row["city"], []).append(row)
    return grouped


def process_city(city, client, today: date, days: int, max_rows: int):
    adapter = SocrataAdapter(city, client, days=days, max_rows=max_rows, today=today)
    raw, meta = adapter.fetch()
    kept, dropped, warnings = [], Counter(), Counter()
    for row in raw:
        permit, reason, warns = validate(normalize(city, row, meta["date_field"]), city, today)
        warnings.update(warns)
        if reason:
            dropped[reason] += 1
        else:
            kept.append(permit)
    kept, duplicates = dedupe(kept)
    kept.sort(key=lambda p: p["issued_date"], reverse=True)
    kept = kept[:max_rows]
    stats = {
        "fetched": len(raw),
        "dropped": dict(dropped),
        "warnings": dict(warnings),
        "duplicates": duplicates,
        "date_field": meta["date_field"],
    }
    return kept, stats


def write_outputs(out_dir: Path, rows: list, blocks: list, mode: str, days: int) -> None:
    status = {
        "mode": mode,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window_days": days,
        "totals": totals(rows),
        "cities": blocks,
    }
    _write_json(out_dir / "permits.json", rows)
    _write_json(out_dir / "status.json", status, pretty=True)


def run(city_keys, client, out_dir, today: date, days: int = DAYS,
        max_rows: int = MAX_ROWS_PER_CITY) -> int:
    out_dir = Path(out_dir)
    previous = load_previous(out_dir)
    all_rows: list[dict] = []
    blocks: list[dict] = []

    for key in city_keys:
        city = CITIES[key]
        block = {"key": city.key, "name": city.name, "state": city.state,
                 "source_url": city.page_url, "window_days": days}
        try:
            rows, stats = process_city(city, client, today, days, max_rows)
            block.update(stats)
            block["status"] = "ok" if len(rows) >= MIN_ROWS_OK else "warning"
            block["error"] = None
            if block["status"] == "warning":
                block["message"] = (f"Only {len(rows)} rows kept (expected at least "
                                    f"{MIN_ROWS_OK}). The source may have changed.")
        except Exception as exc:  # noqa: BLE001 - one portal must never break the rest
            rows = previous.get(city.name, [])
            block.update({
                "fetched": 0, "dropped": {}, "warnings": {}, "duplicates": 0,
                "date_field": None,
                "status": "stale" if rows else "error",
                "error": f"{type(exc).__name__}: {exc}"[:300],
            })
        block["kept"] = len(rows)
        block["latest_date"] = latest(rows)
        block["coverage"] = coverage(rows)
        all_rows.extend(rows)
        blocks.append(block)
        print(f"[{block['status']:>7}] {city.name}: kept {block['kept']} of {block['fetched']} fetched"
              + (f"  ({block['error']})" if block["error"] else ""))

    if all_rows:  # never replace good data with nothing
        all_rows.sort(key=lambda p: p["issued_date"], reverse=True)
        write_outputs(out_dir, all_rows, blocks, "live", days)
        print(f"Wrote {len(all_rows)} permits to {out_dir}")

    worked = any(b["status"] in ("ok", "warning") for b in blocks)
    if not worked:
        print("No city could be fetched. Failing so you get alerted.", file=sys.stderr)
    return 0 if worked else 1


def run_sample(out_dir, today: date, days: int = DAYS) -> int:
    rows = generate(today)
    blocks = []
    for key, city in CITIES.items():
        city_rows = [r for r in rows if r["city"] == city.name]
        blocks.append({
            "key": city.key, "name": city.name, "state": city.state,
            "source_url": city.page_url, "window_days": days,
            "fetched": len(city_rows), "kept": len(city_rows), "dropped": {},
            "warnings": {}, "duplicates": 0, "date_field": None,
            "status": "demo", "error": None,
            "latest_date": latest(city_rows), "coverage": coverage(city_rows),
        })
    write_outputs(Path(out_dir), rows, blocks, "sample", days)
    print(f"Wrote {len(rows)} DEMO permits to {out_dir}")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Refresh the Permit Tracker data files.")
    parser.add_argument("--sample", action="store_true", help="write generated demo data (no network)")
    parser.add_argument("--cities", default=",".join(CITIES), help="comma-separated city keys")
    parser.add_argument("--days", type=int, default=DAYS)
    parser.add_argument("--max-rows", type=int, default=MAX_ROWS_PER_CITY)
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args(argv)
    today = datetime.now(timezone.utc).date()

    if args.sample:
        return run_sample(args.out, today, args.days)

    keys = [k.strip() for k in args.cities.split(",") if k.strip()]
    unknown = [k for k in keys if k not in CITIES]
    if unknown:
        parser.error(f"unknown city keys {unknown}; choose from {list(CITIES)}")
    return run(keys, Client(), args.out, today, args.days, args.max_rows)


if __name__ == "__main__":
    sys.exit(main())
