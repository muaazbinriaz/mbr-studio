// components/sections/HeroAmbient.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroAmbient() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <motion.div
        className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-[120px] dark:bg-primary/25"
        animate={
          shouldReduceMotion ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px] dark:bg-accent/20"
        animate={
          shouldReduceMotion ? undefined : { x: [0, -30, 0], y: [0, -40, 0] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
    </div>
  );
}
