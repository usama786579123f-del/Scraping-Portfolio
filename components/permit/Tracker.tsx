"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  Home,
  Info,
  Search,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CATEGORY_LABEL,
  countWindow,
  formatDate,
  formatMoney,
  formatPct,
  latestDate,
  pctChange,
  toCsv,
  toMs,
  weeklyBuckets,
  type Bucket,
  type Category,
  type CityStatus,
  type Permit,
  type Status,
} from "@/lib/permits";

const PermitMap = dynamic(() => import("./PermitMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-brand-mist" />,
});

type CatFilter = "all" | "new_construction" | "roofing" | "solar" | "addition_remodel" | "other";

const CHIPS: { key: CatFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new_construction", label: "New construction" },
  { key: "roofing", label: "Roofing" },
  { key: "solar", label: "Solar" },
  { key: "addition_remodel", label: "Remodel / addition" },
  { key: "other", label: "Other" },
];

const MAIN: Category[] = ["new_construction", "roofing", "solar", "addition_remodel"];

const BADGE: Record<Category, string> = {
  new_construction: "bg-brand-soft text-brand",
  roofing: "bg-amber-50 text-amber-700",
  solar: "bg-teal-50 text-teal-700",
  addition_remodel: "bg-sky-50 text-sky-700",
  demolition: "bg-slate-100 text-slate-600",
  electrical: "bg-slate-100 text-slate-600",
  plumbing_hvac: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-600",
};

const STATUS_BADGE: Record<CityStatus["status"], string> = {
  ok: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  stale: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
  demo: "bg-slate-100 text-slate-600",
};

const matchCat = (p: Permit, f: CatFilter) =>
  f === "all" ? true : f === "other" ? !MAIN.includes(p.category) : p.category === f;

function matchQuery(p: Permit, q: string) {
  if (!q) return true;
  return [p.address, p.contractor, p.type, p.description, p.permit_number]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

/* ---------------- small pieces ---------------- */

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-ink-muted">vs last week</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon size={13} />
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

function Kpi({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: number; delta: number | null }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        {icon}
      </span>
      <div>
        <div className="text-sm text-ink-muted">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-ink">{value}</span>
          <Delta value={delta} />
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const unit = Math.pow(10, Math.floor(Math.log10(max)));
  let top = Math.ceil(max / unit) * unit;
  if (top % 2) top += 1;

  const W = 640, H = 240, padL = 36, padR = 8, padT = 16, padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / buckets.length;
  const y = (v: number) => padT + plotH * (1 - v / top);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Permits issued per week">
      {[0, top / 2, top].map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#E4E6F5" strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5B5F7A">
            {t}
          </text>
        </g>
      ))}
      {buckets.map((b, i) => {
        const w = slot * 0.56;
        const x = padL + i * slot + (slot - w) / 2;
        return (
          <g key={b.range}>
            <title>{`${b.range}: ${b.count} permits`}</title>
            <rect x={x} y={y(b.count)} width={w} height={Math.max(0, y(0) - y(b.count))} rx={6} fill="#4F46E5" />
            <text x={x + w / 2} y={y(b.count) - 5} textAnchor="middle" fontSize="11" fontWeight={600} fill="#14143A">
              {b.count}
            </text>
            <text x={x + w / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="#5B5F7A">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- trust panel ---------------- */

const STEPS = [
  ["Fetch", "Official open-data API of each city, polite rate limit, honest User-Agent."],
  ["Normalize", "Different column names, addresses and permit types become one schema."],
  ["Validate", "Bad dates, wrong coordinates and missing fields are dropped or blanked, and counted."],
  ["Deduplicate", "The same permit listed twice is merged into the most complete copy."],
  ["Monitor", "Too few rows or a failed source is flagged; old data is kept and marked stale."],
];

function TrustPanel({ status }: { status: Status | null }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="trust-title">
      <h2 id="trust-title" className="text-lg font-bold text-ink">
        How this data gets here
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="rounded-xl bg-brand-mist p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                {i + 1}
              </span>
              {title}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{text}</p>
          </li>
        ))}
      </ol>

      {status && (
        <>
          <h3 className="mt-7 text-sm font-bold text-ink">Data quality by source</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-semibold">Source</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Rows kept</th>
                  <th className="py-2 pr-3 font-semibold">Latest permit</th>
                  <th className="py-2 pr-3 font-semibold">Has map point</th>
                  <th className="py-2 pr-3 font-semibold">Has cost</th>
                  <th className="py-2 font-semibold">Has contractor</th>
                </tr>
              </thead>
              <tbody>
                {status.cities.map((c) => (
                  <tr key={c.key} className="border-t border-brand/10">
                    <td className="py-2.5 pr-3 font-medium text-ink">
                      {c.source_url ? (
                        <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
                          {c.name}, {c.state} <ExternalLink size={12} />
                        </a>
                      ) : (
                        `${c.name}, ${c.state}`
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="py-2.5 pr-3">{c.kept}</td>
                    <td className="py-2.5 pr-3">{c.latest_date ? formatDate(c.latest_date) : "—"}</td>
                    <td className="py-2.5 pr-3">{formatPct(c.coverage.coordinates)}</td>
                    <td className="py-2.5 pr-3">{formatPct(c.coverage.value)}</td>
                    <td className="py-2.5">{formatPct(c.coverage.contractor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {status.cities.some((c) => Object.keys(c.dropped).length > 0) && (
            <p className="mt-3 text-xs text-ink-muted">
              Rows rejected by validation:{" "}
              {status.cities
                .flatMap((c) => Object.entries(c.dropped).map(([k, n]) => `${c.name} ${k.replace(/_/g, " ")} (${n})`))
                .join(", ")}
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}

/* ---------------- main ---------------- */

export default function Tracker({ permits, status }: { permits: Permit[]; status: Status | null }) {
  const [city, setCity] = useState("all");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CatFilter>("all");
  const [sort, setSort] = useState<"date" | "value">("date");
  const [visible, setVisible] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cities = useMemo(() => Array.from(new Set(permits.map((p) => p.city))).sort(), [permits]);
  const refMs = useMemo(() => {
    const d = latestDate(permits);
    return d ? toMs(d) : null;
  }, [permits]);

  const q = query.trim().toLowerCase();
  const base = useMemo(
    () => permits.filter((p) => (city === "all" || p.city === city) && matchQuery(p, q)),
    [permits, city, q],
  );
  const view = useMemo(() => {
    const rows = base.filter((p) => matchCat(p, cat));
    return rows.sort((a, b) =>
      sort === "date"
        ? b.issued_date.localeCompare(a.issued_date)
        : (b.value ?? -1) - (a.value ?? -1),
    );
  }, [base, cat, sort]);

  const mapPoints = useMemo(
    () => view.filter((p): p is Permit & { lat: number; lon: number } => p.lat != null && p.lon != null).slice(0, 600),
    [view],
  );
  const mappable = useMemo(() => view.filter((p) => p.lat != null && p.lon != null).length, [view]);

  const kpi = useMemo(() => {
    if (refMs === null) return null;
    const of = (rows: Permit[]) => {
      const cur = countWindow(rows, refMs, 0, 6);
      const prev = countWindow(rows, refMs, 7, 13);
      return { cur, delta: pctChange(cur, prev) };
    };
    return {
      all: of(base),
      roofing: of(base.filter((p) => p.category === "roofing")),
      solar: of(base.filter((p) => p.category === "solar")),
    };
  }, [base, refMs]);

  const buckets = useMemo(() => (refMs === null ? [] : weeklyBuckets(view, refMs, 8)), [view, refMs]);

  const demo = status?.mode !== "live";

  function exportCsv() {
    const blob = new Blob([toCsv(view)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permits-${city === "all" ? "all-cities" : city.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetPaging<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setVisible(10);
    };
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-brand/10 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand">
              <ArrowLeft size={16} /> Portfolio
            </Link>
            <span className="h-5 w-px bg-brand/15" />
            <span className="text-lg font-bold tracking-tight text-ink">
              Permit <span className="text-brand">Tracker</span>
            </span>
          </div>
          {status && (
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-block ${
                demo ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {demo ? "Demo data" : `Live public records · updated ${formatDate(status.generated_at.slice(0, 10))}`}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">New building permits, cleaned and mapped</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            A Python pipeline reads the open-data portals of several US cities every day, standardises the records,
            checks them, and publishes this page. Useful for roofers, solar installers and builders looking for new work.
          </p>
        </div>

        {demo && (
          <div role="note" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              <strong>Demo data.</strong> The rows below are generated samples so the page works before the first live
              run. After the pipeline runs against the city portals this banner switches to “Live public records”.
            </p>
          </div>
        )}

        {permits.length === 0 ? (
          <div className="card p-8 text-center text-ink-muted">
            No data file found. Run <code className="rounded bg-brand-soft px-1.5 py-0.5 text-brand">python -m pipeline.run --sample</code>{" "}
            to create demo data, then rebuild.
          </div>
        ) : (
          <>
            {/* controls */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <select
                aria-label="City"
                value={city}
                onChange={(e) => resetPaging(setCity)(e.target.value)}
                className="h-11 rounded-xl border border-brand/20 bg-white px-3 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="all">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="relative flex-1">
                <span className="sr-only">Search permits</span>
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  value={query}
                  onChange={(e) => resetPaging(setQuery)(e.target.value)}
                  placeholder="Search address, contractor, description…"
                  className="h-11 w-full rounded-xl border border-brand/20 bg-white pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </label>
              <button type="button" onClick={exportCsv} className="btn-outline h-11" disabled={view.length === 0}>
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Permit category">
              {CHIPS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={cat === c.key}
                  onClick={() => resetPaging(setCat)(c.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    cat === c.key
                      ? "border-brand bg-brand text-white"
                      : "border-brand/20 bg-white text-ink hover:bg-brand-soft"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* KPIs */}
            {kpi && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Kpi icon={<CalendarDays size={22} />} label="New this week" value={kpi.all.cur} delta={kpi.all.delta} />
                <Kpi icon={<Home size={22} />} label="Roofing" value={kpi.roofing.cur} delta={kpi.roofing.delta} />
                <Kpi icon={<Sun size={22} />} label="Solar" value={kpi.solar.cur} delta={kpi.solar.delta} />
              </div>
            )}

            {/* map + table */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="isolate h-[320px] overflow-hidden rounded-2xl border border-brand/10 shadow-card sm:h-[440px]">
                  <PermitMap points={mapPoints} selectedId={selectedId} onSelect={setSelectedId} />
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {mappable > mapPoints.length
                    ? `Showing the newest ${mapPoints.length} of ${mappable} mappable permits.`
                    : `${mappable} permits with a map point.`}{" "}
                  Click a row or a dot to focus it.
                </p>
              </div>

              <div className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-brand/10 px-4 py-3">
                  <span className="text-sm font-semibold text-ink">
                    {view.length} permit{view.length === 1 ? "" : "s"}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-ink-muted">
                    Sort by
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as "date" | "value")}
                      className="rounded-lg border border-brand/20 bg-white px-2 py-1 text-xs font-medium text-ink"
                    >
                      <option value="date">Newest</option>
                      <option value="value">Highest value</option>
                    </select>
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-brand-mist text-xs uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Address</th>
                        <th className="px-3 py-2.5 font-semibold">Type</th>
                        <th className="px-3 py-2.5 font-semibold">Value</th>
                        <th className="px-3 py-2.5 font-semibold">Date</th>
                        <th className="px-3 py-2.5 font-semibold">Contractor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.slice(0, visible).map((p) => (
                        <tr
                          key={p.id}
                          tabIndex={0}
                          aria-selected={p.id === selectedId}
                          onClick={() => p.lat != null && setSelectedId(p.id)}
                          onKeyDown={(e) => e.key === "Enter" && p.lat != null && setSelectedId(p.id)}
                          className={`border-t border-brand/10 outline-none transition focus-visible:bg-brand-soft ${
                            p.lat != null ? "cursor-pointer hover:bg-brand-mist" : ""
                          } ${p.id === selectedId ? "bg-brand-mist" : ""}`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-ink">{p.address}</div>
                            <div className="text-xs text-ink-muted">
                              {p.city}, {p.state}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[p.category]}`}>
                              {CATEGORY_LABEL[p.category]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{formatMoney(p.value)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-ink-muted">{formatDate(p.issued_date)}</td>
                          <td className="px-3 py-2.5 text-ink-muted">{p.contractor ?? "—"}</td>
                        </tr>
                      ))}
                      {view.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                            No permits match these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {view.length > visible && (
                  <div className="border-t border-brand/10 p-3 text-center">
                    <button type="button" onClick={() => setVisible((v) => v + 10)} className="btn-outline !py-2">
                      Show more ({view.length - visible} left)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* weekly chart */}
            <section className="card p-5 sm:p-6" aria-labelledby="weekly-title">
              <h2 id="weekly-title" className="text-lg font-bold text-ink">
                Permits per week
              </h2>
              <p className="text-xs text-ink-muted">Last 8 weeks, for the current filters. Bars are labelled by the first day of each week.</p>
              <div className="mt-3 overflow-x-auto">
                <div className="min-w-[520px]">
                  <WeeklyChart buckets={buckets} />
                </div>
              </div>
            </section>
          </>
        )}

        <TrustPanel status={status} />

        <p className="pb-6 text-xs leading-relaxed text-ink-muted">
          Source: public building-permit records published on city open-data portals. Contractor names are the business
          names listed on the permit record; owners and applicants are never shown. Records can be incomplete or delayed,
          so verify details with the issuing city. This is a portfolio project and is not affiliated with any government
          agency.
        </p>
      </main>
    </div>
  );
}
