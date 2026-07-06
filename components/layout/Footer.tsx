import Link from "next/link";

import { services } from "@/data/services";
import { siteConfig } from "@/config/site";

const sitemapLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "AI Agent", href: "/ai-agent" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

const socialLinks = [
  { label: "X", href: siteConfig.links.twitter },
  { label: "LinkedIn", href: siteConfig.links.linkedin },
  { label: "GitHub", href: siteConfig.links.github },
] as const;

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

const footerLinkClass =
  "text-sm text-secondary-text transition-colors hover:text-foreground";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-x-6">
          {/* Column 1 — Brand + socials */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              {siteConfig.name}
            </Link>
            <p className="mt-3 max-w-[26ch] text-sm text-secondary-text">
              {siteConfig.tagline}
            </p>
            <nav aria-label="Social" className="mt-6 flex gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  {social.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Column 2 — Sitemap */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-text">
              Sitemap
            </h3>
            <nav
              aria-label="Sitemap"
              className="mt-4 flex flex-col items-start gap-3"
            >
              {sitemapLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={footerLinkClass}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Services */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-text">
              Services
            </h3>
            <nav
              aria-label="Services"
              className="mt-4 flex flex-col items-start gap-3"
            >
              {services.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services#${service.slug}`}
                  className={footerLinkClass}
                >
                  {service.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-text">
              Contact
            </h3>
            <div className="mt-4 flex flex-col items-start gap-3">
              <a
                href={`mailto:${siteConfig.email}`}
                className={footerLinkClass}
              >
                {siteConfig.email}
              </a>
              <Link href="/contact" className={footerLinkClass}>
                Book a Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — copyright + legal */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-6 py-6 text-xs text-secondary-text sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
