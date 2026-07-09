"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/animations/FadeIn";

export function AiAgentFeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <FadeIn
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.05 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className="group relative rounded-2xl border border-border bg-card p-8 shadow-sm transition-colors duration-200 hover:border-primary/50"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mb-2 font-heading text-lg font-semibold text-text">
          {title}
        </h3>
        <p className="font-body text-sm leading-relaxed text-secondary-text">
          {description}
        </p>
      </div>
    </FadeIn>
  );
}
