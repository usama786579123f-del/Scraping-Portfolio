import { ArrowRight } from "lucide-react";

const projects = [
  {
    title: "Permit Tracker",
    tag: "Live demo · 3 US cities",
    text: "New building permits from city open-data portals, cleaned, validated and mapped. Built for roofers, solar installers and builders.",
    img: "/projects/permit-tracker.jpg",
    href: "/permit-tracker",
  },
  {
    title: "Risk Checker",
    tag: "Coming next",
    text: "A company's safety, environmental and complaint records from federal public data, matched to the right company with a confidence score.",
    img: "/projects/risk-checker.jpg",
  },
  {
    title: "Contract Finder",
    tag: "Coming next",
    text: "US government contract bids in one place, with due dates and budgets pulled out of the PDFs and filtered by state and category.",
    img: "/projects/contract-finder.jpg",
  },
];

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-6xl scroll-mt-20 px-5">
      <div className="max-w-2xl">
        <span className="section-label">Projects</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">US public data, made usable</h2>
        <p className="mt-3 text-ink-muted">
          One Python pipeline behind all three: fetch from official sources, clean, validate, remove duplicates,
          and monitor. Every dataset is public records and every screen says where the data came from.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {projects.map((p) => {
          const live = Boolean(p.href);
          const body = (
            <>
              <div className="overflow-hidden rounded-2xl border border-brand/10 bg-brand-mist shadow-card transition group-hover:shadow-float">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={`${p.title} dashboard mockup`} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {p.tag}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.text}</p>
              {live && (
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Open live demo <ArrowRight size={15} />
                </span>
              )}
            </>
          );
          return live ? (
            <a key={p.title} href={p.href} className="group block">
              {body}
            </a>
          ) : (
            <div key={p.title} className="group">
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
