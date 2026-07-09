import type { Metadata } from "next";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { projects } from "@/data/projects";
import type { Project } from "@/types";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";

/**
 * Portfolio Page — Prompt 14 (part 2 of 2), SEO pass in Prompt 20.
 *
 * Blueprint ref: Part 2, Section 8 (Portfolio page).
 *
 * SEO PASS: title trimmed from "Portfolio | MBR Studio" to just "Portfolio"
 * (see layout.tsx comment for the duplication bug this avoids). Added
 * canonical URL and a BreadcrumbList schema per Blueprint Part 2 Section 13.
 */
export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Websites, AI chatbots, e-commerce builds, and SaaS products designed and engineered by MBR Studio.",
  alternates: {
    canonical: "/portfolio",
  },
};

export default function PortfolioPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Portfolio", url: `${siteConfig.url}/portfolio` },
        ])}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              Portfolio
            </p>
            <h1 className="font-heading text-[36px] font-bold leading-tight tracking-tight text-text sm:text-[48px] md:text-[56px]">
              Work built for real businesses, not a mockup gallery.
            </h1>
          </div>

          <PortfolioGrid projects={projects as Project[]} />
        </div>
      </section>

      {/* Closing CTA — reused pattern from about/page.tsx & case-studies/[slug]/page.tsx */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <h2 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-text sm:text-[36px]">
            See something close to what you need?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            Let&apos;s talk about your project — no sales team, just a direct
            conversation with the person who&apos;ll build it.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="rounded-lg px-7 py-6">
              <Link href="/contact">
                Book a Free Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
