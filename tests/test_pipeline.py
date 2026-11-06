"""Offline tests: no network is used; portals are replaced by a fake client."""
import json
from datetime import date

import pytest

from pipeline.adapters.socrata import AdapterError, SocrataAdapter
from pipeline.config import CHICAGO, CITIES, SAN_FRANCISCO, SEATTLE
from pipeline.dedupe import dedupe
from pipeline.http import HttpError
from pipeline.make_sample import generate
from pipeline.normalize import classify, normalize, parse_date, parse_money
from pipeline.run import run, run_sample
from pipeline.validate import validate

TODAY = date(2026, 11, 6)

CHI_ROW = {
    "permit_": "100123456", "permit_type": "PERMIT - EXPRESS PERMIT PROGRAM",
    "issue_date": "2026-11-03T00:00:00.000",
    "work_description": "RE-ROOF EXISTING 2 STORY BUILDING - TEAR OFF AND REPLACE SHINGLES",
    "reported_cost": "18500", "street_number": "742", "street_direction": "N",
    "street_name": "PINECREST", "suffix": "AVE", "latitude": "41.9", "longitude": "-87.65",
    "contact_1_type": "OWNER", "contact_1_name": "JANE EXAMPLE",
    "contact_2_type": "CONTRACTOR-GENERAL CONTRACTOR", "contact_2_name": "SUMMIT ROOFING LLC",
}
SEA_ROW = {
    "permitnum": "7163412-CN", "permittypedesc": "Addition/Alteration",
    "description": "Adding a kitchen and updating floors", "estprojectcost": "125000",
    "issueddate": "2026-11-02T00:00:00.000", "originaladdress1": "8015 28TH AVE NE",
    "originalzip": "98115-1234", "latitude": "47.68718305", "longitude": "-122.29742548",
    "contractorcompanyname": "NORTHGATE BUILDERS INC",
}
SF_ROW = {
    "permit_number": "202611012345", "permit_type_definition": "otc alterations permit",
    "description": "install rooftop solar panels", "estimated_cost": "22000",
    "issued_date": "2026-11-04T00:00:00.000", "street_number": "319", "street_name": "Maple St",
    "zipcode": "94110", "location": {"type": "Point", "coordinates": [-122.42, 37.75]},
}


# ---------- normalize ----------
def test_chicago_row():
    p = normalize(CHICAGO, CHI_ROW, "issue_date")
    assert p["id"] == "chicago:100123456"
    assert p["address"] == "742 N Pinecrest Ave"
    assert p["type"] == "Express Permit Program"
    assert p["category"] == "roofing"
    assert p["value"] == 18500.0
    assert p["issued_date"] == "2026-11-03"
    assert p["contractor"] == "Summit Roofing LLC"
    assert "JANE" not in json.dumps(p).upper()  # owners are never published


def test_seattle_row():
    p = normalize(SEATTLE, SEA_ROW, "issueddate")
    assert p["address"] == "8015 28th Ave NE"
    assert p["category"] == "addition_remodel"
    assert p["zip"] == "98115"
    assert p["contractor"] == "Northgate Builders Inc"
    assert (p["lat"], p["lon"]) == (47.68718305, -122.29742548)


def test_sf_row_geojson_and_wkt():
    p = normalize(SAN_FRANCISCO, SF_ROW, "issued_date")
    assert p["category"] == "solar"
    assert (p["lat"], p["lon"]) == (37.75, -122.42)
    assert p["contractor"] is None
    wkt = dict(SF_ROW, location="POINT (-122.42 37.75)")
    assert normalize(SAN_FRANCISCO, wkt, "issued_date")["lat"] == 37.75


def test_new_construction_is_not_called_roofing():
    assert classify("PERMIT - NEW CONSTRUCTION", "new house with roof deck") == "new_construction"
    assert classify("Demolition", "remove roof") == "demolition"
    assert classify(None, None) == "other"


def test_parsers():
    assert parse_date("2026-02-30") is None
    assert parse_date("11/5/2026") == "2026-11-05"
    assert parse_money("$1,250.50") == 1250.5
    assert parse_money("0") is None and parse_money("abc") is None


def test_placeholder_contractor_is_dropped():
    row = dict(CHI_ROW, contact_2_name="OWNER")
    assert normalize(CHICAGO, row, "issue_date")["contractor"] is None


# ---------- validate ----------
def _good():
    return normalize(CHICAGO, CHI_ROW, "issue_date")


def test_validate_drops_bad_rows():
    assert validate(dict(_good(), issued_date="2026-12-31"), CHICAGO, TODAY)[1] == "future_date"
    assert validate(dict(_good(), issued_date=None), CHICAGO, TODAY)[1] == "bad_date"
    assert validate(dict(_good(), permit_number=None), CHICAGO, TODAY)[1] == "no_permit_number"
    assert validate(dict(_good(), address=None), CHICAGO, TODAY)[1] == "no_address"


def test_validate_blanks_wrong_coordinates_but_keeps_row():
    p, reason, warns = validate(dict(_good(), lat=0.0, lon=0.0), CHICAGO, TODAY)
    assert reason is None and p["lat"] is None and "geo_out_of_bounds" in warns


# ---------- dedupe ----------
def test_dedupe_keeps_most_complete():
    a = dict(_good(), contractor=None, value=None)
    b = _good()
    kept, dups = dedupe([a, b])
    assert dups == 1 and len(kept) == 1 and kept[0]["contractor"] == "Summit Roofing LLC"


# ---------- adapter ----------
class FakeClient:
    def __init__(self, handler):
        self.handler, self.calls = handler, []

    def get_json(self, url, params=None):
        self.calls.append((url, dict(params or {})))
        return self.handler(url, dict(params or {}))


def test_adapter_falls_back_to_next_date_column():
    def handler(url, params):
        if "issueddate" in params["$where"] or "issued_date" in params["$where"]:
            raise HttpError(400, "no such column")
        return [SEA_ROW]
    client = FakeClient(handler)
    rows, meta = SocrataAdapter(SEATTLE, client, 60, 100, TODAY).fetch()
    assert meta["date_field"] == "applieddate" and len(rows) == 1


def test_adapter_error_when_no_date_column_works():
    client = FakeClient(lambda u, p: (_ for _ in ()).throw(HttpError(400, "bad")))
    with pytest.raises(AdapterError):
        SocrataAdapter(SEATTLE, client, 60, 100, TODAY).fetch()


def test_adapter_paginates_and_caps():
    client = FakeClient(lambda u, p: [dict(CHI_ROW, permit_=str(p["$offset"] + i)) for i in range(p["$limit"])])
    rows, meta = SocrataAdapter(CHICAGO, client, 60, 7, TODAY, page_size=3).fetch()
    assert len(rows) == 7 and meta["pages"] == 3


def test_adapter_does_not_swallow_server_errors():
    client = FakeClient(lambda u, p: (_ for _ in ()).throw(HttpError(500, "boom")))
    with pytest.raises(HttpError):
        SocrataAdapter(CHICAGO, client, 60, 100, TODAY).fetch()


# ---------- end to end ----------
def _rows_for(url, n=25):
    if "cityofchicago" in url:
        return [dict(CHI_ROW, permit_=f"C{i}") for i in range(n)]
    if "seattle" in url:
        return [dict(SEA_ROW, permitnum=f"S{i}") for i in range(n)]
    return [dict(SF_ROW, permit_number=f"F{i}") for i in range(n)]


def test_run_end_to_end_and_stale_fallback(tmp_path):
    keys = list(CITIES)
    assert run(keys, FakeClient(lambda u, p: _rows_for(u)), tmp_path, TODAY) == 0
    status = json.loads((tmp_path / "status.json").read_text())
    assert status["mode"] == "live" and status["totals"]["permits"] == 75
    assert {c["status"] for c in status["cities"]} == {"ok"}

    def flaky(url, params):
        if "seattle" in url:
            raise RuntimeError("portal down")
        return _rows_for(url)
    assert run(keys, FakeClient(flaky), tmp_path, TODAY) == 0
    status = json.loads((tmp_path / "status.json").read_text())
    by_name = {c["name"]: c for c in status["cities"]}
    assert by_name["Seattle"]["status"] == "stale" and by_name["Seattle"]["kept"] == 25
    assert status["totals"]["permits"] == 75  # nothing lost


def test_run_fails_loudly_and_writes_nothing_when_everything_breaks(tmp_path):
    def down(url, params):
        raise RuntimeError("down")
    assert run(list(CITIES), FakeClient(down), tmp_path, TODAY) == 1
    assert not (tmp_path / "permits.json").exists()


def test_few_rows_is_a_warning(tmp_path):
    assert run(["chicago"], FakeClient(lambda u, p: _rows_for(u, 3)), tmp_path, TODAY) == 0
    status = json.loads((tmp_path / "status.json").read_text())
    assert status["cities"][0]["status"] == "warning"


# ---------- sample data ----------
def test_sample_data_matches_real_schema_and_passes_validation(tmp_path):
    real_keys = set(normalize(CHICAGO, CHI_ROW, "issue_date"))
    rows = generate(TODAY)
    assert len(rows) > 100
    by_name = {c.name: c for c in CITIES.values()}
    for r in rows:
        assert set(r) == real_keys
        assert validate(r, by_name[r["city"]], TODAY)[1] is None
    run_sample(tmp_path, TODAY)
    assert json.loads((tmp_path / "status.json").read_text())["mode"] == "sample"
