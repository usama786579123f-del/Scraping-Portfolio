import { ArrowRight, Mail, Database, Phone, MessageCircle } from "lucide-react";
import { site } from "@/site.config";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* soft indigo glow */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-40 h-[320px] w-[320px] rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-2 md:pb-24 md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white px-3.5 py-1.5 text-xs font-medium text-ink shadow-card">
            <span className="h-2 w-2 rounded-full bg-brand" />
            {site.role}
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            I Turn Websites
            <br />
            Into <span className="text-brand">Data</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
            Python pipelines that turn US public records and government data into clean, validated datasets.
            Public data only, delivered as CSV, API or dashboards.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#projects" className="btn-primary">
              View Projects <ArrowRight size={16} />
            </a>
            <a href="#contact" className="btn-outline">
              <Mail size={16} /> Hire Me
            </a>
          </div>

          {site.phone && (
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
              <a href={`tel:${site.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-brand">
                <Phone size={15} /> {site.phone}
              </a>
              <a
                href={`https://wa.me/${site.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-brand"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            </p>
          )}
        </div>

        {/* Portrait + floating cards */}
        <div className="relative mx-auto h-[460px] w-full max-w-md sm:h-[540px]">
          <div className="absolute inset-x-6 bottom-0 top-10 rounded-[2.5rem] bg-gradient-to-b from-brand/20 to-brand/5" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.photo}
            alt={site.name}
            className="absolute bottom-0 left-1/2 h-[92%] -translate-x-1/2 object-contain drop-shadow-2xl"
          />

          {/* code window */}
          <div className="absolute -left-2 top-4 w-48 -rotate-6 rounded-xl bg-ink p-3 shadow-float sm:-left-10 sm:w-56">
            <div className="mb-2 flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              <span className="h-2 w-2 rounded-full bg-green-400" />
            </div>
            <pre className="font-mono text-[10px] leading-4 text-indigo-200">
{`import scrapy
class Spider(scrapy.Spider):
    def parse(self, response):
        yield {...}`}
            </pre>
          </div>

          {/* badge */}
          <div className="absolute -left-2 bottom-24 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-float sm:-left-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <Database size={16} />
            </span>
            <div>
              <div className="text-sm font-bold text-ink leading-tight">Public Data</div>
              <div className="text-[10px] text-ink-muted">100% compliant scraping</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
