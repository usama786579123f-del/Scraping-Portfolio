"""Reads a city's building-permit dataset from its Socrata open-data API."""
from __future__ import annotations

from datetime import date, timedelta

from ..config import City
from ..http import HttpError


class AdapterError(Exception):
    pass


class SocrataAdapter:
    def __init__(self, city: City, client, days: int, max_rows: int, today: date,
                 page_size: int = 1000):
        self.city = city
        self.client = client
        self.days = days
        self.max_rows = max_rows
        self.today = today
        self.page_size = page_size

    def _fetch_all(self, date_field: str):
        since = (self.today - timedelta(days=self.days)).isoformat()
        rows: list[dict] = []
        pages = 0
        while len(rows) < self.max_rows:
            limit = min(self.page_size, self.max_rows - len(rows))
            params = {
                "$where": f"{date_field} >= '{since}T00:00:00'",
                "$order": f"{date_field} DESC",
                "$limit": limit,
                "$offset": len(rows),
            }
            page = self.client.get_json(self.city.api_url, params)
            pages += 1
            if not isinstance(page, list):
                raise AdapterError(f"unexpected response from {self.city.api_url}: {str(page)[:120]}")
            rows.extend(page)
            if len(page) < limit:
                break
        return rows, {"date_field": date_field, "pages": pages}

    def fetch(self):
        """Try each candidate date column; a 400 means this portal does not have it."""
        last_error = None
        for date_field in self.city.date_fields:
            try:
                return self._fetch_all(date_field)
            except HttpError as exc:
                if exc.status == 400:
                    last_error = exc
                    continue
                raise
        raise AdapterError(
            f"none of the date columns {self.city.date_fields} were accepted by "
            f"{self.city.domain} ({last_error}). Run: python -m pipeline.discover"
        )
