"""Which city portals we read, and how their column names map to our schema.

Adding a city = adding one entry to CITIES (see README, "Add a city").

Field lists hold *candidate* column names: the first one present in a row wins,
so a renamed column on a portal does not silently break the pipeline.
San Francisco's columns were checked against the city's published data
dictionary. Chicago and Seattle use their documented names plus fallbacks;
run `python -m pipeline.discover` to confirm them against the live portals.
"""
from __future__ import annotations

from dataclasses import dataclass

DAYS = 60                  # how far back to look
MAX_ROWS_PER_CITY = 1000   # keeps the published JSON small
MIN_ROWS_OK = 20           # fewer rows than this = "warning" (source may have changed)
GEO_LAT_TOL = 0.7          # coordinates further than this from the city centre are rejected
GEO_LON_TOL = 1.0


@dataclass(frozen=True, eq=False)
class City:
    key: str
    name: str
    state: str
    domain: str
    dataset_id: str
    center: tuple                 # (lat, lon), used to sanity-check coordinates
    date_fields: tuple            # candidates; the first one the portal accepts is used
    fields: dict                  # logical field -> candidate column names
    contractor_fields: tuple = ()  # ((type_column or None, name_column), ...)

    @property
    def api_url(self) -> str:
        return f"https://{self.domain}/resource/{self.dataset_id}.json"

    @property
    def page_url(self) -> str:
        return f"https://{self.domain}/d/{self.dataset_id}"


CHICAGO = City(
    key="chicago",
    name="Chicago",
    state="IL",
    domain="data.cityofchicago.org",
    dataset_id="ydr8-5enu",
    center=(41.8781, -87.6298),
    date_fields=("issue_date",),
    fields={
        "permit_number": ("permit_", "permit_number"),
        "type": ("permit_type",),
        "description": ("work_description",),
        "value": ("reported_cost",),
        "street_number": ("street_number",),
        "street_direction": ("street_direction",),
        "street_name": ("street_name",),
        "street_suffix": ("suffix", "street_suffix"),
        "lat": ("latitude",),
        "lon": ("longitude",),
        "location": ("location",),
    },
    # Chicago lists up to 15 contacts per permit. We only ever read contacts
    # whose type says "contractor"; owners and applicants are never published.
    contractor_fields=tuple((f"contact_{i}_type", f"contact_{i}_name") for i in range(1, 16)),
)

SEATTLE = City(
    key="seattle",
    name="Seattle",
    state="WA",
    domain="cos-data.seattle.gov",
    dataset_id="76t5-zqzr",
    center=(47.6062, -122.3321),
    date_fields=("issueddate", "issued_date", "applieddate"),
    fields={
        "permit_number": ("permitnum", "permit_number", "permitnumber"),
        "type": ("permittypedesc", "permittypemapped", "permitclass", "permittype"),
        "description": ("description",),
        "value": ("estprojectcost", "est_project_cost"),
        "full_address": ("originaladdress1", "address"),
        "zip": ("originalzip", "zipcode"),
        "lat": ("latitude",),
        "lon": ("longitude",),
        "location": ("location",),
    },
    contractor_fields=((None, "contractorcompanyname"),),
)

SAN_FRANCISCO = City(
    key="san-francisco",
    name="San Francisco",
    state="CA",
    domain="data.sfgov.org",
    dataset_id="i98e-djp9",
    center=(37.7749, -122.4194),
    date_fields=("issued_date", "filed_date"),
    fields={
        "permit_number": ("permit_number",),
        "type": ("permit_type_definition", "permit_type"),
        "description": ("description",),
        "value": ("estimated_cost", "revised_cost"),
        "street_number": ("street_number",),
        "street_name": ("street_name",),
        "zip": ("zipcode",),
        "location": ("location",),
        "lat": ("latitude",),
        "lon": ("longitude",),
    },
    contractor_fields=(),  # this dataset has no contractor column
)

CITIES = {c.key: c for c in (CHICAGO, SEATTLE, SAN_FRANCISCO)}
