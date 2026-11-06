export type Category =
  | "new_construction"
  | "roofing"
  | "solar"
  | "addition_remodel"
  | "demolition"
  | "electrical"
  | "plumbing_hvac"
  | "other";

export const CATEGORY_LABEL: Record<Category, string> = {
  new_construction: "New construction",
  roofing: "Roofing",
  solar: "Solar",
  addition_remodel: "Remodel / addition",
  demolition: "Demolition",
  electrical: "Electrical",
  plumbing_hvac: "Plumbing / HVAC",
  other: "Other",
};

export interface Permit {
  id: string;
  city: string;
  state: string;
  permit_number: string;
  type: string | null;
  category: Category;
  description: string | null;
  address: string;
  zip: string | null;
  issued_date: string; // YYYY-MM-DD
  value: number | null;
  contractor: string | null;
  lat: number | null;
  lon: number | null;
  source_url: string | null;
}

export interface CityStatus {
  key: string;
  name: string;
  state: string;
  source_url: string;
  status: "ok" | "warning" | "stale" | "error" | "demo";
  fetched: number;
  kept: number;
  dropped: Record<string, number>;
  duplicates: number;
  latest_date: string | null;
  error: string | null;
  message?: string;
  coverage: { coordinates: number; value: number; contractor: number };
}

export interface Status {
  mode: "live" | "sample";
  generated_at: string;
  window_days: number;
  totals: { permits: number; with_coordinates: number; with_value: number; with_contractor: number };
  cities: CityStatus[];
}

const DAY = 86_400_000;

export const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** Newest permit date. "This week" is measured from here, so the page reads right even if the feed is a day behind. */
export function latestDate(permits: Permit[]): string | null {
  let best: string | null = null;
  for (const p of permits) if (!best || p.issued_date > best) best = p.issued_date;
  return best;
}

/** Permits issued between `from` and `to` days before the reference date (inclusive). */
export function countWindow(permits: Permit[], refMs: number, from: number, to: number): number {
  let n = 0;
  for (const p of permits) {
    const ago = Math.round((refMs - toMs(p.issued_date)) / DAY);
    if (ago >= from && ago <= to) n++;
  }
  return n;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface Bucket {
  label: string;
  range: string;
  count: number;
}

const fmtShort = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function weeklyBuckets(permits: Permit[], refMs: number, weeks = 8): Bucket[] {
  const out: Bucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const startAgo = i * 7 + 6;
    const endAgo = i * 7;
    const startMs = refMs - startAgo * DAY;
    const endMs = refMs - endAgo * DAY;
    out.push({
      label: fmtShort(startMs),
      range: `${fmtShort(startMs)} – ${fmtShort(endMs)}`,
      count: countWindow(permits, refMs, endAgo, startAgo),
    });
  }
  return out;
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const formatMoney = (v: number | null) => (v == null ? "—" : money.format(v));

export const formatDate = (d: string) =>
  new Date(toMs(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const formatPct = (v: number) => `${Math.round(v * 100)}%`;

// Cells that start with = + - @ can run as formulas when a CSV is opened in Excel.
// The data comes from outside, so we neutralise them.
// Only text is guarded: real numbers such as a longitude of -122.3 must stay numbers.
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Permit[]): string {
  const header = ["City", "State", "Permit #", "Type", "Category", "Description", "Address", "Issued", "Value", "Contractor", "Latitude", "Longitude", "Source"];
  const lines = rows.map((p) =>
    [p.city, p.state, p.permit_number, p.type, CATEGORY_LABEL[p.category], p.description, p.address, p.issued_date, p.value, p.contractor, p.lat, p.lon, p.source_url]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
