import {
  ArrowRight,
  Cpu,
  Database,
  FileText,
  Globe,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Zap,
  Scale,
  Wrench,
  PackageCheck,
} from "lucide-react";

/* ---------------- Tech stack ---------------- */
const stack = ["Python", "Scrapy", "Playwright", "Selenium", "Supabase", "Vercel"];

export function TechStack() {
  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-brand/10 bg-brand-mist px-6 py-5 sm:flex-row sm:items-center">
        <span className="text-sm font-semibold leading-tight text-ink">
          Trusted
          <br />
          Tech Stack:
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3">
          {stack.map((s) => (
            <span key={s} className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
const services = [
  { icon: Globe, title: "Web Scraping", text: "Extract public data from any website, at scale." },
  { icon: ShieldCheck, title: "Anti-bot Handling", text: "Reliable access to protected public sites using proper techniques." },
  { icon: Cpu, title: "AI Data Extraction", text: "Turn unstructured pages into structured insights." },
  { icon: FileText, title: "PDF/OCR Extraction", text: "Get data from PDFs, scans and images." },
  { icon: Zap, title: "Automation", text: "Automate repetitive tasks and scheduled workflows." },
  { icon: Database, title: "Data Cleaning", text: "Clean, deduplicate and prepare your data." },
];

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <span className="section-label">My Services</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">What I Do</h2>
          <p className="mt-3 text-ink-muted">End-to-end solutions for your data and automation needs.</p>
          <a href="#contact" className="btn-primary mt-6">
            Get a Quote <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5 transition hover:-translate-y-1 hover:shadow-float">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Stats (honest) ---------------- */
const stats = [
  { icon: Database, value: "3", label: "City open-data sources" },
  { icon: Zap, value: "6", label: "Core services" },
  { icon: ShieldCheck, value: "100%", label: "Public data only" },
  { icon: Scale, value: "robots.txt", label: "Respected by default" },
];

export function Stats() {
  return (
    <section className="mx-auto mt-6 max-w-6xl px-5">
      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-brand/10 bg-brand-mist px-6 py-6 md:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-card">
              <Icon size={20} />
            </span>
            <div>
              <div className="text-xl font-extrabold text-ink">{value}</div>
              <div className="text-xs text-ink-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Process ---------------- */
const steps = [
  { icon: Search, title: "Discover", text: "Understand your needs and goals." },
  { icon: Settings, title: "Build", text: "Develop robust, scalable solutions." },
  { icon: Rocket, title: "Deliver", text: "Ship on time with quality checks." },
  { icon: RefreshCw, title: "Maintain", text: "Ongoing support and updates." },
];

export function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="max-w-xl">
        <span className="section-label">My Process</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">How I Work</h2>
        <p className="mt-3 text-ink-muted">A simple, transparent process to turn your idea into results.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="card relative p-6 text-center">
            <span className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon size={22} />
            </span>
            <h3 className="mt-4 font-bold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Principles (replaces fake testimonials) ---------------- */
// TODO: Jab asli clients ke reviews mil jayein, yahan testimonials section add kar dein.
const principles = [
  {
    icon: Scale,
    title: "Compliance first",
    text: "Public data only. robots.txt and Terms of Service checked, polite rate limits, and personal data filtered out.",
  },
  {
    icon: Wrench,
    title: "Built to survive changes",
    text: "Monitoring and alerts so you know when a site changes, with fixes designed in rather than bolted on.",
  },
  {
    icon: PackageCheck,
    title: "Clean delivery",
    text: "Deduplicated, validated data in CSV, JSON, API or Google Sheets, with clear documentation.",
  },
];

export function Principles() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20">
      <div className="max-w-xl">
        <span className="section-label">Why Work With Me</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Reliable by design</h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {principles.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon size={20} />
            </span>
            <h3 className="mt-4 font-bold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
