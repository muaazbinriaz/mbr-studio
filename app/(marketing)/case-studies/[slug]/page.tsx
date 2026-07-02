import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { projects } from "@/data/projects";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";

/**
 * Case Study Template — Prompt 14 (part 2 of 2, cont.)
 *
 * Blueprint ref: Part 2, Section 8 — 7-section structure:
 * Hero, Problem, Solution, Tech Stack, Outcome, Visuals, CTA.
 *
 * data/projects.ts only guarantees slug/title/client/industry/summary/
 * image/tags/category. The richer fields (problem, solution, outcome,
 * visuals) are optional on the type — any project missing them still
 * renders all 7 sections, with a quiet placeholder in place of the
 * missing content, rather than a blank or broken-looking section.
 * Fill those fields in per-project whenever the write-up is ready.
 */

interface CaseStudyPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return (projects as Project[]).map((project) => ({
    slug: project.slug,
  }));
}

export function generateMetadata({ params }: CaseStudyPageProps): Metadata {
  const project = (projects as Project[]).find((p) => p.slug === params.slug);

  if (!project) {
    return { title: "Case Study | MBR Studio" };
  }

  return {
    title: `${project.title} | MBR Studio Case Studies`,
    description: project.summary,
  };
}

export default function CaseStudyPage({ params }: CaseStudyPageProps) {
  const project = (projects as Project[]).find((p) => p.slug === params.slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      {/* 1. Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-medium text-primary">
              {project.category}
            </span>
            <span className="font-body text-sm text-secondary-text">
              {project.client} · {project.industry}
            </span>
          </div>

          <h1 className="max-w-3xl font-heading text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[44px] md:text-[56px]">
            {project.title}
          </h1>
          <p className="mt-5 max-w-2xl font-body text-base text-secondary-text sm:text-lg">
            {project.summary}
          </p>

          <div className="relative mt-12 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-secondary-background">
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Problem + 3. Solution */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-2 md:px-10 md:py-28">
          <div>
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              The problem
            </p>
            <p className="font-heading text-xl font-medium leading-relaxed text-text sm:text-2xl">
              {project.problem ?? (
                <span className="text-secondary-text">
                  We&apos;re finalizing the write-up for this section — check
                  back soon for the full story behind {project.title}.
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              The solution
            </p>
            <p className="font-heading text-xl font-medium leading-relaxed text-text sm:text-2xl">
              {project.solution ?? (
                <span className="text-secondary-text">
                  We&apos;re finalizing the write-up for this section — check
                  back soon for how we approached {project.title}.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Tech Stack */}
      {project.tags.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">
            <p className="mb-6 font-body text-sm font-medium tracking-wide text-accent">
              Tech stack
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border bg-card px-3 py-1.5 font-body text-sm text-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Outcome */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-28">
          <p className="mb-8 font-body text-sm font-medium tracking-wide text-accent">
            Outcome
          </p>

          {project.outcome && project.outcome.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {project.outcome.map((item) => (
                <div key={item.label}>
                  <p className="font-heading text-3xl font-bold text-text sm:text-4xl">
                    {item.metric}
                  </p>
                  <p className="mt-1 font-body text-sm text-secondary-text">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="max-w-lg font-body text-base text-secondary-text">
              Results and metrics for this project are being finalized with the
              client — reach out if you&apos;d like the details directly.
            </p>
          )}
        </div>
      </section>

      {/* 6. Visuals — only rendered if extra gallery images exist */}
      {project.visuals && project.visuals.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-28">
            <p className="mb-8 font-body text-sm font-medium tracking-wide text-accent">
              Visuals
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {project.visuals.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-secondary-background"
                >
                  <Image
                    src={src}
                    alt={`${project.title} — visual ${i + 1}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. CTA */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <h2 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-text sm:text-[36px]">
            Have a similar project in mind?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            Let&apos;s talk about what you&apos;re building and whether
            it&apos;s a fit for MBR Studio.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-lg px-7 py-6">
              <Link href="/contact">
                Book a Free Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg px-7 py-6"
            >
              <Link href="/portfolio">View more work</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
