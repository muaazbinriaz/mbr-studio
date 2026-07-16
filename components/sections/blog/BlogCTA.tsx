import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { primaryCta } from "@/config/site";

export function BlogCTA() {
  return (
    <section
      aria-labelledby="blog-cta-heading"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 text-center md:p-12"
    >
      <div
        aria-hidden="true"
        className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-accent/20 blur-[90px]"
      />
      <div className="relative">
        <h2
          id="blog-cta-heading"
          className="font-heading text-2xl font-bold leading-tight text-text md:text-3xl"
        >
          Need a website, SaaS application, or AI automation for your business?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-secondary-text">
          We&apos;ll walk through what you actually need — no generic pitch, no
          pressure — on a free 20-minute call.
        </p>
        <Link
          href={primaryCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-primary to-primary/90 px-6 text-base font-medium text-primary-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
        >
          {primaryCta.label}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
