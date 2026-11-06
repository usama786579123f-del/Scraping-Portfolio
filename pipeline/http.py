"""A polite HTTP client: honest User-Agent, retries, and a pause after every request."""
from __future__ import annotations

import os
import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

DEFAULT_UA = "PermitTracker/1.0 (portfolio project; contact via the GitHub repository)"


class HttpError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(f"HTTP {status}: {message}")
        self.status = status


class Client:
    def __init__(self, user_agent: str | None = None, app_token: str | None = None,
                 delay: float = 1.0, timeout: int = 60):
        self.session = requests.Session()
        retry = Retry(total=3, backoff_factor=2, status_forcelist=(429, 500, 502, 503, 504),
                      allowed_methods=("GET",))
        self.session.mount("https://", HTTPAdapter(max_retries=retry))
        self.session.headers["User-Agent"] = (
            user_agent or os.environ.get("PIPELINE_USER_AGENT") or DEFAULT_UA
        )
        token = app_token or os.environ.get("SOCRATA_APP_TOKEN")  # optional, free, raises rate limits
        if token:
            self.session.headers["X-App-Token"] = token
        self.delay = delay
        self.timeout = timeout

    def get_json(self, url: str, params: dict | None = None):
        resp = self.session.get(url, params=params, timeout=self.timeout)
        time.sleep(self.delay)  # never hammer a public portal
        if resp.status_code >= 400:
            raise HttpError(resp.status_code, resp.text[:200])
        return resp.json()
