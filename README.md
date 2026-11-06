# Python Data Portfolio + Permit Tracker

A Next.js portfolio site (Vercel) with a live-data project, **Permit Tracker**, fed by a Python pipeline (GitHub Actions).

```
GitHub Actions (daily)         public/data/*.json          Vercel
python -m pipeline.run   -->   permits.json, status.json -->  /permit-tracker
fetch > normalize > validate > dedupe > publish             map, table, chart
```

## 1. Make the portfolio yours
- `site.config.ts`: name, email, social links
- Photo: put a background-removed PNG at `public/me.png`, then set `photo: "/me.png"` in `site.config.ts`
- Testimonials are left out on purpose. Add real client reviews to `components/Sections.tsx` when you have them.

## 2. Run the site locally
```bash
npm install
npm run dev          # http://localhost:3000  and  /permit-tracker
```
The page ships with **clearly labelled demo data** so it works immediately.

## 3. Switch Permit Tracker to LIVE data
Do this on your own computer (the portals must be reachable):
```bash
pip install -r pipeline/requirements.txt pytest
python -m pytest -q                 # 17 offline tests, no network
python -m pipeline.discover         # checks the real column names of each portal
python -m pipeline.run              # fetches live data, overwrites public/data/*.json
```
**Run `discover` first.** The San Francisco columns were checked against the city's data dictionary.
Chicago and Seattle use their documented names plus fallbacks, but I could not call those portals from where I
built this. If a line shows `--`, add the real column name to that city's list in `pipeline/config.py`.

When `status.json` says `"mode": "live"`, the page banner changes from "Demo data" to "Live public records".

## 4. Deploy for free
1. Push this folder to a **public** GitHub repo.
2. vercel.com -> Add New Project -> pick the repo -> Deploy (no settings to change).
3. The workflow `.github/workflows/refresh-data.yml` runs daily, refreshes `public/data`, and commits it.
   Every commit makes Vercel redeploy automatically. You can also run it by hand from the Actions tab.
4. If no city can be fetched, the job fails and GitHub emails you. Old data stays up, marked `stale`.
5. Optional: a free Socrata app token (add as repo secret `SOCRATA_APP_TOKEN`) raises the portal rate limits.

## Add a city
Add one `City(...)` entry to `pipeline/config.py` and put it in `CITIES`. Any city on a Socrata open-data portal works
(find the dataset ID in its URL). Run `discover`, fix any `--` lines, done.

## What the Python pipeline does
| Step | File | What |
|---|---|---|
| Fetch | `adapters/socrata.py`, `http.py` | official API, paging, retries, 1s pause, honest User-Agent |
| Normalize | `normalize.py` | one schema; addresses, dates, costs, permit categories |
| Validate | `validate.py` | drops bad rows, blanks wrong coordinates, counts every rejection |
| Deduplicate | `dedupe.py` | keeps the most complete copy of a repeated permit |
| Publish | `run.py` | atomic JSON write, stale fallback, never overwrites good data with nothing |
| Monitor | `run.py`, `status.json` | per-city status, coverage %, exit code 1 if nothing worked |

## Legal and privacy notes (not legal advice)
- Only official open-data APIs of city governments. No login, no CAPTCHA, no bypassing anything.
- Contractor **business** names only. Owners, applicants and architects are never read or published.
- Respect each portal's terms. Heavy use: get a free app token. Check a portal's terms before selling its data.
- The map uses OpenStreetMap tiles, which is fine for a portfolio. For real traffic use a tile provider.
- Do not turn this into tenant/employment screening or people search; those fall under laws such as FCRA.
