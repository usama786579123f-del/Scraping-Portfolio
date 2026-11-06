import { Github, Linkedin, Mail, Send, Twitter, Youtube } from "lucide-react";
import { Logo } from "./Navbar";
import { site } from "@/site.config";

export function AboutContact() {
  const socials = [
    { icon: Linkedin, href: site.links.linkedin, label: "LinkedIn" },
    { icon: Github, href: site.links.github, label: "GitHub" },
    { icon: Youtube, href: site.links.youtube, label: "YouTube" },
    { icon: Twitter, href: site.links.x, label: "X" },
  ];

  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* About */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="h-44 w-44 shrink-0 overflow-hidden rounded-full border-4 border-brand/15 bg-gradient-to-b from-brand/20 to-brand/5 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.photo} alt={site.name} className="h-full w-full object-cover object-top" />
          </div>
          <div>
            <span className="section-label">About Me</span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
              Python Engineer | Data Problem Solver
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              I build scalable scrapers, automate workflows and turn messy public web data into
              clean, usable datasets, with compliance and reliability built in from day one.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-7">
          <span className="section-label">Get In Touch</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Let’s Work Together</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Have a project in mind? Tell me what data you need and I’ll reply with an approach and a quote.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={`mailto:${site.email}`} className="btn-primary">
              <Send size={16} /> Send Message
            </a>
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/20 text-brand transition hover:bg-brand hover:text-white"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-4 pb-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 rounded-3xl bg-ink px-8 py-7 md:flex-row">
        <Logo light />
        <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-white/90">
          {["Home", "Services", "Projects", "Process", "Contact"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-indigo-300">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-1 text-xs text-white/70 md:items-end">
          <span className="flex items-center gap-1.5">
            <Mail size={12} /> {site.email}
          </span>
          <span>© {new Date().getFullYear()} {site.brand}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
