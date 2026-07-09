"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/types";
import { FadeIn } from "@/components/animations/FadeIn";

export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <FadeIn
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-200 hover:border-primary/50"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />

      <Link
        href={`/case-studies/${project.slug}`}
        className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden bg-secondary-background">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-body text-sm text-secondary-text">
              {project.title}
            </div>
          )}
        </div>

        <div className="p-6">
          <p className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-secondary-text">
            {project.client} · {project.industry}
          </p>
          <h3 className="mb-2 font-heading text-lg font-semibold text-text">
            {project.title}
          </h3>
          <p className="mb-4 font-body text-sm leading-relaxed text-secondary-text">
            {project.summary}
          </p>
          {project.tags && project.tags.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border bg-secondary-background px-2.5 py-1 font-body text-xs text-secondary-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-primary transition-colors duration-200 group-hover:text-accent">
            View Case Study
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </FadeIn>
  );
}
