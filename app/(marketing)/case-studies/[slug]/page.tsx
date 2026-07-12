import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { projects } from "@/data/projects";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, caseStudySchema } from "@/lib/seo/schemas";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>; // ✅ params is async
}

export function generateStaticParams() {
  return (projects as Project[]).map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = (projects as Project[]).find((p) => p.slug === slug);

  if (!project) {
    return { title: "Case Study" };
  }

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/case-studies/${project.slug}` },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = (projects as Project[]).find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Case Studies", url: `${siteConfig.url}/case-studies` },
          {
            name: project.title,
            url: `${siteConfig.url}/case-studies/${project.slug}`,
          },
        ])}
      />
      <JsonLd
        data={caseStudySchema(
          project,
          `${siteConfig.url}/case-studies/${project.slug}`,
        )}
      />

      {/* 1. Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-32">
          <Link
            href="/case-studies"
            className="mb-6 inline-flex items-center gap-1.5 font-body text-sm text-secondary-text hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to case studies
          </Link>

          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-medium text-primary">
              {project.category}
            </span>
            <span className="font-body text-sm text-secondary-text">
              {project.client} · {project.industry}
            </span>
          </div>

          <h1
            className="max-w-3xl font-heading text-h1-secondary font-bold leading-tight tracking-tight text-text
"
          >
            {project.title}
          </h1>
          <p className="mt-5 max-w-2xl font-body text-base text-secondary-text sm:text-lg">
            {project.summary}
          </p>

          {/* Live site link only */}
          {project.link && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="sm" className="rounded-lg">
                <Link
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Live Site
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          <div className="relative mt-12 w-full overflow-hidden rounded-2xl border border-border bg-secondary-background">
            <Image
              src={project.image}
              alt={project.title}
              width={1920}
              height={1080}
              sizes="100vw"
              priority
              className="w-full h-auto rounded-lg"
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

      {/* 6. Visuals — multiple screenshots gallery */}
      {project.images && project.images.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-28">
            <p className="mb-8 font-body text-sm font-medium tracking-wide text-accent">
              Screenshots
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.images.map((src, i) => (
                <div
                  key={src}
                  className="relative w-full overflow-hidden rounded-xl border border-border bg-secondary-background"
                >
                  <Image
                    src={src}
                    alt={`${project.title} screenshot ${i + 1}`}
                    width={1920}
                    height={1080}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="w-full h-auto rounded-lg"
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
          <h2
            className="font-heading text-h2-section font-bold leading-tight tracking-tight text-text
"
          >
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
