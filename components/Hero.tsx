import { ArrowRight, Mail, Database } from "lucide-react";
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

          {/* price trend */}
          <div className="absolute -right-1 top-6 w-36 rounded-xl bg-white p-3 shadow-float sm:-right-6 sm:w-40">
            <div className="text-[10px] font-semibold text-ink">Price Trend</div>
            <div className="text-[10px] font-semibold text-emerald-500">↑ +24%</div>
            <svg viewBox="0 0 100 40" className="mt-1 h-10 w-full">
              <polyline
                points="0,34 15,28 28,31 42,20 56,24 70,12 85,16 100,4"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* data preview */}
          <div className="absolute -right-1 bottom-10 w-40 rounded-xl bg-white p-3 shadow-float sm:-right-6 sm:w-44">
            <div className="mb-1.5 text-[10px] font-semibold text-ink">Data Preview</div>
            <table className="w-full font-mono text-[9px] text-ink-muted">
              <thead>
                <tr className="text-left text-ink">
                  <th className="font-semibold">id</th>
                  <th className="font-semibold">price</th>
                  <th className="font-semibold">date</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>101</td><td>$24.5</td><td>01-01</td></tr>
                <tr><td>102</td><td>$27.9</td><td>01-02</td></tr>
                <tr><td>103</td><td>$26.8</td><td>01-03</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
