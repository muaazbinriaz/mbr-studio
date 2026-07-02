"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Code2, UserCheck, Zap, type LucideIcon } from "lucide-react";

/**
 * WhyChooseUs — Prompt 11 (part 1 of 2)
 *
 * Blueprint ref: Part 1, Section 7 (Home Page section order:
 * ... → Process → Why Choose Us → Technologies → ...)
 *
 * Deliberately NOT another icon-grid-of-cards — Services already owns
 * that layout, and repeating it here would make the two sections blur
 * together on scroll. Instead: a two-column split, static heading on
 * the left, a stacked list of differentiators on the right, each
 * revealing independently as it scrolls into view.
 */

interface Differentiator {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DIFFERENTIATORS: Differentiator[] = [
  {
    icon: UserCheck,
    title: "Senior-led, not outsourced",
    description:
      "You work directly with the person building your product — no account managers, no junior handoffs.",
  },
  {
    icon: Code2,
    title: "Modern, production-grade stack",
    description:
      "Next.js, TypeScript, and tooling built to scale — not a template stitched together to look finished.",
  },
  {
    icon: Bot,
    title: "AI automation included",
    description:
      "Every build can ship with a working chatbot or workflow automation, not bolted on as an afterthought.",
  },
  {
    icon: Zap,
    title: "Fast, transparent turnaround",
    description:
      "Clear timelines and regular updates — no disappearing for weeks between milestones.",
  },
];

export function WhyChooseUs() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-20">
          {/* Left: static heading */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              Why MBR Studio
            </p>
            <h2 className="font-heading text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[40px]">
              Built by an engineer who ships, not an agency that manages.
            </h2>
          </div>

          {/* Right: stacked differentiators */}
          <div className="divide-y divide-border">
            {DIFFERENTIATORS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="flex gap-5 py-8 first:pt-0 last:pb-0"
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-heading text-lg font-semibold text-text">
                      {item.title}
                    </h3>
                    <p className="max-w-md font-body text-sm leading-relaxed text-secondary-text">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
