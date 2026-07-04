import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { projects } from "@/data/projects";
import type { Project } from "@/types";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";

/**
 * Case Studies index — the write-up-oriented counterpart to /portfolio.
 *
 * /portfolio (PortfolioGrid.tsx) is a filterable visual gallery.
 * This page is intentionally simpler: a straight list of entries, each
 * surfacing the content that's unique to a case-study view (client,
 * industry, and a pull line from `problem` or `outcome`) rather than
 * repeating the image-grid-with-category-tabs pattern.
 */

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "In-depth write-ups of real MBR Studio projects — the problem, the approach, and the outcome.",
  alternates: {
    canonical: "/case-studies",
  },
};

function pullLine(project: Project): string | null {
  if (project.problem) return project.problem;
  if (project.outcome && project.outcome.length > 0) {
    const [first] = project.outcome;
    return `${first.metric} — ${first.label}`;
  }
  return null;
}

export default function CaseStudiesPage() {
  const list = projects as Project[];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Case Studies", url: `${siteConfig.url}/case-studies` },
        ])}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              Case Studies
            </p>
            <h1 className="font-heading text-[36px] font-bold leading-tight tracking-tight text-text sm:text-[48px] md:text-[56px]">
              The problem, the approach, and the outcome — for real projects.
            </h1>
          </div>

          {list.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-8 py-16 text-center">
              <p className="font-heading text-lg font-medium text-text">
                Case studies are on their way.
              </p>
              <p className="mt-2 font-body text-sm text-secondary-text">
                We&apos;re preparing write-ups for recent projects — check back
                soon.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border border-y border-border">
              {list.map((project) => {
                const pull = pullLine(project);
                return (
                  <Link
                    key={project.slug}
                    href={`/case-studies/${project.slug}`}
                    className="group flex flex-col gap-3 py-8 transition-colors duration-200 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-8"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 font-body text-xs font-medium uppercase tracking-wide text-secondary-text">
                        {project.client} · {project.industry}
                      </p>
                      <h2 className="mb-2 font-heading text-xl font-semibold text-text transition-colors duration-200 group-hover:text-primary sm:text-2xl">
                        {project.title}
                      </h2>
                      <p className="max-w-2xl font-body text-sm leading-relaxed text-secondary-text sm:text-base">
                        {project.summary}
                      </p>
                      <p className="mt-3 max-w-2xl font-body text-sm italic leading-relaxed text-secondary-text/80">
                        {pull ?? "Full write-up coming soon."}
                      </p>
                    </div>

                    <span className="inline-flex flex-none items-center gap-1.5 font-body text-sm font-medium text-primary transition-colors duration-200 group-hover:text-accent">
                      Read case study
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
