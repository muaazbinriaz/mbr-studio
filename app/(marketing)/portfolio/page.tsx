import type { Metadata } from "next";

import { projects } from "@/data/projects";
import type { Project } from "@/types";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
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
    </>
  );
}
