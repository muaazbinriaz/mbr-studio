"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, HelpCircle, icons as lucideIcons } from "lucide-react";

import { services } from "@/data/services";
import type { Service } from "@/types";
import { FadeIn } from "@/components/animations/FadeIn";

/**
 * Services — Prompt 8
 *
 * Blueprint ref: Part 1, Section 7 (Services spec)
 *
 * data/services.ts stores `icon` as a string (e.g. "LayoutTemplate")
 * matching lucide-react's PascalCase export names. `lucide-react`
 * ships an `icons` map keyed exactly this way, so we look the
 * component up at render time instead of importing every icon by name.
 * Falls back to HelpCircle + a console warning if a slug is ever
 * typo'd, so a bad string degrades gracefully instead of crashing.
 */

export function Services() {
  return (
    <section id="services" className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            What we do
          </p>
          <h2
            className="font-heading text-h2-feature font-bold leading-tight tracking-tight text-text
"
          >
            Everything you need to grow online, under one roof.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={service.slug} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  const Icon = lucideIcons[service.icon as keyof typeof lucideIcons];
  if (!Icon && process.env.NODE_ENV !== "production") {
    console.warn(
      `[Services] "${service.icon}" is not a valid lucide-react icon name (service: ${service.slug}). Falling back to HelpCircle.`,
    );
  }
  const ResolvedIcon = Icon ?? HelpCircle;

  return (
    <FadeIn
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.05 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className="group relative rounded-2xl border border-border bg-card p-8 transition-colors duration-200 hover:border-primary/50"
    >
      {/* Border glow — soft ring that fades in on hover, doesn't affect layout */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20">
          <ResolvedIcon className="h-5 w-5" strokeWidth={1.75} />
        </div>

        <h3 className="mb-2 font-heading text-lg font-semibold text-text">
          {service.title}
        </h3>

        <p className="mb-6 font-body text-sm leading-relaxed text-secondary-text">
          {service.description}
        </p>

        <Link
          href={
            service.slug === "ai-business-automation"
              ? "/ai-agent"
              : `/services#${service.slug}`
          }
          className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-primary transition-colors duration-200 hover:text-accent"
        >
          Learn more
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </FadeIn>
  );
}
