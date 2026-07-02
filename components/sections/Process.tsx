"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * Process — Prompt 10
 *
 * Blueprint ref: Part 1, Section 7 (Home Page section order:
 * ... → Featured Projects → Process → ...)
 *
 * A vertical timeline: a static track line with a primary-colored
 * progress line drawn on top of it, tied to scroll position within the
 * section (useScroll + useTransform on scaleY). Each step also
 * independently fades/slides in via whileInView as it crosses the
 * viewport, so the effect reads as "the line fills in as you read
 * down the steps" rather than one blanket animation.
 *
 * Numbered markers are appropriate here — this genuinely is a fixed,
 * ordered sequence a client moves through, not decoration.
 */

const STEPS = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We learn your business, audience, and goals before writing a single line of code.",
  },
  {
    number: "02",
    title: "Planning",
    description:
      "We map the sitemap, tech stack, and timeline so nothing is guessed mid-build.",
  },
  {
    number: "03",
    title: "Design",
    description:
      "We design high-fidelity interfaces, refined until every screen earns its place.",
  },
  {
    number: "04",
    title: "Development",
    description:
      "We build with production-grade code, reviewed and tested as we go.",
  },
  {
    number: "05",
    title: "Testing",
    description:
      "We test across devices, browsers, and edge cases before anything goes live.",
  },
  {
    number: "06",
    title: "Launch",
    description:
      "We deploy, monitor, and confirm everything performs exactly as designed.",
  },
  {
    number: "07",
    title: "Support",
    description:
      "We stay on to maintain, improve, and scale the product as your business grows.",
  },
] as const;

export function Process() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            How we work
          </p>
          <h2 className="font-heading text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[40px] md:text-[48px]">
            A clear process, from first call to launch and beyond.
          </h2>
        </div>

        <div ref={containerRef} className="relative">
          {/* Track line */}
          <div
            aria-hidden="true"
            className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-border md:left-[23px]"
          />
          {/* Progress line, scales in with scroll */}
          <motion.div
            aria-hidden="true"
            style={{
              scaleY: shouldReduceMotion ? 1 : lineScale,
              transformOrigin: "top",
            }}
            className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-primary md:left-[23px]"
          />

          <ol className="space-y-12 md:space-y-16">
            {STEPS.map((step, index) => (
              <ProcessStep key={step.number} step={step} index={index} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ProcessStep({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.05 }}
      className="relative flex gap-6 pl-0 md:gap-8"
    >
      {/* Numbered marker */}
      <div className="relative z-10 flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border bg-card font-heading text-xs font-semibold text-text md:h-12 md:w-12 md:text-sm">
        {step.number}
      </div>

      <div className="pt-1.5 md:pt-2.5">
        <h3 className="mb-2 font-heading text-xl font-semibold text-text md:text-2xl">
          {step.title}
        </h3>
        <p
          className="max-w-lg font-body text-sm leading-relaxed text-secondary-text
 md:text-base"
        >
          {step.description}
        </p>
      </div>
    </motion.li>
  );
}
