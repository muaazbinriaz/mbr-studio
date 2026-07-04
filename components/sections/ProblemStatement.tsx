"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/animations/FadeIn";

/**
 * ProblemStatement — Prompt 7
 *
 * Blueprint ref: Part 1, Section 7 (Home Page section order:
 * Hero → Problem Statement → Services → ...)
 *
 * Primarily typographic — no illustration, no card grid. A single
 * confident statement, left-aligned, with a thin accent rule as the
 * only graphic element. Scroll-reveal is subtle and respects
 * prefers-reduced-motion.
 *
 * CLEANUP NOTE: the paragraph's fade+slide-up now uses the shared
 * FadeIn component (y={12} + a viewport override to preserve the exact
 * original amount:0.6 trigger point). The accent rule's scaleX "draw"
 * animation is a different mechanism entirely (not a fade+slide) and
 * intentionally stays as its own motion.div.
 */
export function ProblemStatement() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="max-w-3xl">
          {/* Accent rule — the one graphic element */}
          <motion.div
            initial={shouldReduceMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
            className="mb-8 h-[2px] w-16 bg-accent"
          />

          <FadeIn y={12} viewport={{ once: true, amount: 0.6 }} delay={0.1}>
            <p className="font-heading text-[26px] font-semibold leading-[1.3] tracking-tight text-text sm:text-[32px] md:text-[40px] lg:text-[44px]">
              Most businesses aren&apos;t losing customers to competitors —
              they&apos;re losing them to a website that loads slowly, looks
              outdated, or doesn&apos;t exist at all.{" "}
              <span className="text-secondary-text">
                Every day without a fast, well-built digital presence is a day
                your competitors capture the customer you should have had.
              </span>
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
