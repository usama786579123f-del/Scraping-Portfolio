import fs from "node:fs";
import path from "node:path";
import { ArrowRight, ShieldCheck, Crosshair, MapPin } from "lucide-react";
import { site } from "@/site.config";

// Drop a real screenshot into public/projects/ named exactly <slug>.png (or .jpg / .webp)
// and the card shows it. Without one, the card shows a plain panel: no invented numbers.
function screenshot(slug: string): string | null {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (fs.existsSync(path.join(process.cwd(), "public", "projects", `${slug}.${ext}`))) {
      return `/projects/${slug}.${ext}`;
    }
  }
  return null;
}

const projects = [
  {
    slug: "review-sniper",
    title: "ReviewSniper",
    text: "Crisis-lead engine. Open the live dashboard to see it working.",
    href: site.projectLinks.reviewSniper,
    icon: Crosshair,
  },
  {
    slug: "permit-tracker",
    title: "Permit Tracker",
    text: "New building permits from city open-data portals, cleaned, validated and mapped. Built for roofers, solar installers and builders.",
    href: "/permit-tracker",
    icon: MapPin,
  },
  {
    slug: "risk-checker",
    title: "Risk Checker",
    text: "Type a company name. It is checked against the US Treasury sanctions list, and recent risk-related SEC filings are shown with a link to each original.",
    href: site.projectLinks.riskChecker,
    icon: ShieldCheck,
  },
];

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-6xl scroll-mt-20 px-5">
      <div className="max-w-2xl">
        <span className="section-label">Projects</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Working projects, not mockups</h2>
        <p className="mt-3 text-ink-muted">
          Each one is a real app you can open. Where a project uses public data, the page says where the data
          came from.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {projects.map((p) => {
          const live = Boolean(p.href);
          const external = live && p.href.startsWith("http");
          const img = screenshot(p.slug);
          const Icon = p.icon;
          const body = (
            <>
              <div className="overflow-hidden rounded-2xl border border-brand/10 bg-brand-mist shadow-card transition group-hover:shadow-float">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={`${p.title} screenshot`} loading="lazy" className="aspect-[16/9] w-full object-cover object-top" />
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-brand/15 to-brand/5">
                    <Icon size={44} className="text-brand" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {live ? "Live" : "Coming soon"}
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
            <a
              key={p.slug}
              href={p.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group block"
            >
              {body}
            </a>
          ) : (
            <div key={p.slug} className="group">
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
