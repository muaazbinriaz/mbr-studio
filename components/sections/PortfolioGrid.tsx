"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import type { Project, ProjectCategory } from "@/types";

/**
 * PortfolioGrid — Prompt 14 (part 1 of 2)
 *
 * Blueprint ref: Part 2, Section 8 (Portfolio page: grid with category
 * filter tabs — Website / AI Chatbot / E-commerce / SaaS).
 *
 * Requires `project.category` (see types.ts note). Categories shown as
 * tabs are derived from whatever categories actually exist in the data
 * — plus "All" — so this doesn't break if you add a 5th category later
 * without touching this component.
 */

const CATEGORY_ORDER: ProjectCategory[] = [
  "Website",
  "AI Chatbot",
  "E-commerce",
  "SaaS",
];

export function PortfolioGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<ProjectCategory | "All">("All");

  const availableCategories = useMemo(() => {
    const present = new Set(projects.map((p) => p.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [projects]);

  const filtered = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter((p) => p.category === active),
    [projects, active],
  );

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-8 py-16 text-center">
        <p className="font-heading text-lg font-medium text-text">
          Case studies are on their way.
        </p>
        <p className="mt-2 font-body text-sm text-secondary-text">
          We&apos;re preparing write-ups for recent projects — check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter projects by category"
        className="mb-12 flex flex-wrap justify-center gap-2"
      >
        <FilterTab
          label="All"
          isActive={active === "All"}
          onClick={() => setActive("All")}
        />
        {availableCategories.map((category) => (
          <FilterTab
            key={category}
            label={category}
            isActive={active === category}
            onClick={() => setActive(category)}
          />
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center font-body text-sm text-secondary-text">
          No projects in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <PortfolioCard key={project.slug} project={project} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`rounded-full px-4 py-2 font-body text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-transparent text-muted-foreground hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

function PortfolioCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 5) * 0.04 }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-200 hover:border-primary/50"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_8px_30px_-8px_rgba(99,102,241,0.35)] transition-opacity duration-300 group-hover:opacity-100"
      />

      <Link
        href={`/case-studies/${project.slug}`}
        className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-4/3 w-full overflow-hidden bg-secondary-background">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 font-body text-xs font-medium text-muted-foreground backdrop-blur-sm">
            {project.category}
          </span>
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
          <span className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-primary transition-colors duration-200 group-hover:text-accent">
            View Case Study
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
