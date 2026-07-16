// components/sections/FeaturedProjects.tsx (Server Component — no "use client")
"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { projects } from "@/data/projects";
import type { Project } from "@/types";
import { FadeIn } from "@/components/animations/FadeIn";
import { ProjectCard } from "./ProjectCard";

export function FeaturedProjects() {
  const featured = (projects as Project[]).slice(0, 3);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section id="work" className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <FadeIn className="mb-14 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              Selected work
            </p>
            <h2
              className="font-heading text-h2-feature font-bold leading-tight tracking-tight text-text
"
            >
              Projects that showcase what I can build.
            </h2>
          </div>

          <Link
            href="/portfolio"
            className="inline-flex shrink-0 items-center gap-1.5 font-body text-sm font-medium text-primary transition-colors duration-200 hover:text-accent"
          >
            View all work
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </FadeIn>

        <FadeIn
          delay={0.1}
          className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${
            featured.length >= 3 ? "lg:grid-cols-3" : ""
          }`}
        >
          {featured.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
