// components/sections/HeroEyebrow.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroEyebrow() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.p
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 font-body text-sm font-medium tracking-wide text-secondary-text"
    >
      MBR Studio — Digital Product Development &amp; AI Automation
    </motion.p>
  );
}
