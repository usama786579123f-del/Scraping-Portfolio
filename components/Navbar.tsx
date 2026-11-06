import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { site } from "@/site.config";

const links = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="#home" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-card">
        <Database size={18} />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        {site.brand.slice(0, 4)}
        <span className={light ? "text-indigo-300" : "text-brand"}>{site.brand.slice(4)}</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand/10 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition hover:text-brand ${
                i === 0 ? "text-brand" : "text-ink"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#contact" className="btn-primary !px-4 !py-2.5">
            Hire Me <ArrowRight size={16} />
          </a>

          {/* Mobile menu (CSS only, no JS) */}
          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-brand/20 text-ink [&::-webkit-details-marker]:hidden">
              <span className="text-lg leading-none">☰</span>
            </summary>
            <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-brand/10 bg-white p-2 shadow-float">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink hover:bg-brand-soft"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
