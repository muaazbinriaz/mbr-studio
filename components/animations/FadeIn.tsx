"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/**
 * Shared "fade in + slide up on scroll into view" wrapper.
 *
 * Beyond the original `delay`/`className` props, this now accepts:
 * - `viewport` — override the default `{ once: true, margin: "-80px" }`
 *   trigger point (some call sites used `amount: 0.3/0.4/0.6` instead).
 * - `transition` — override the default duration/easing entirely.
 * - `y` — vertical slide distance in px (default 16, matches the most
 *   common call site; some sections used a smaller offset).
 * - any other HTMLMotionProps (`whileHover`, `layout`, etc.) are
 *   forwarded to the underlying motion.div, so call sites that need a
 *   hover effect alongside the entry fade don't have to hand-roll their
 *   own motion.div.
 *
 * Respects prefers-reduced-motion internally (disables the entry
 * animation via `initial={false}`), matching the pattern every section
 * component in this codebase already followed individually — so
 * converting a call site to FadeIn doesn't regress that behavior.
 */
type FadeInProps = Omit<HTMLMotionProps<"div">, "initial" | "whileInView"> & {
  delay?: number;
  y?: number;
};

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  className,
  viewport,
  transition,
  ...rest
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport ?? { once: true, margin: "-80px" }}
      transition={transition ?? { duration: 0.5, delay, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
