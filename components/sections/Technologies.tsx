"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Technologies — Prompt 11 (part 2 of 2)
 *
 * Blueprint ref: Part 1, Section 7 (Home Page section order:
 * ... → Why Choose Us → Technologies → Testimonials → ...)
 *
 * DESIGN NOTE: rendered as a clean typographic wordmark row rather than
 * pulling in brand SVG logos. Two reasons: (1) it keeps the "restraint,
 * typography over decoration" principle from the design system intact
 * instead of introducing a new icon language just for this strip, and
 * (2) real brand marks (Next.js triangle, Vercel logo, etc.) are
 * trademarked assets — safer and more consistent to reference the
 * names in your own type system than to source and embed logo files.
 * If you'd rather have actual logo marks, the `simple-icons` /
 * `react-icons/si` package is the standard way to add them — happy to
 * wire that in as a follow-up if you confirm you want real marks.
 */

const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "Vercel",
] as const;

export function Technologies() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <p className="mb-10 text-center font-body text-sm font-medium tracking-wide text-secondary-text">
          Built on a modern, production-grade stack
        </p>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14"
        >
          {STACK.map((tech) => (
            <span
              key={tech}
              className="font-heading text-lg font-semibold tracking-tight text-secondary-text transition-colors duration-200 hover:text-text sm:text-xl"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
