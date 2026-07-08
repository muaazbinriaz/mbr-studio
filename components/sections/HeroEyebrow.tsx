// components/sections/HeroEyebrow.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * Step 1 redesign: was a plain line of text. Now a glass pill badge with
 * a live-pulse dot + sparkle icon — the "glassmorphism / premium badge"
 * treatment from the redesign brief, applied to the single most-seen
 * element on the site.
 */
export function HeroEyebrow() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-1.5 text-sm font-medium text-secondary-text shadow-sm backdrop-blur-md"
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      Web Development Agency + the AI Chat Agent behind it — try it live below
    </motion.div>
  );
}
