"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Same technique as components/sections/HeroAmbient.tsx (soft blurred
 * blobs drifting slowly), but toned way down — this sits behind
 * dashboard content that people read and scan, not a hero banner, so
 * opacity/blur are both reduced to stay out of the way of legibility.
 *
 * Mounted once inside PlatformShell.tsx (`fixed`, behind everything),
 * so every admin/client page gets it automatically — no per-page setup.
 */
export function PlatformAmbient() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[110px] dark:bg-primary/[0.08]"
        animate={
          shouldReduceMotion ? undefined : { x: [0, 30, 0], y: [0, 20, 0] }
        }
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10%] top-1/2 h-[380px] w-[380px] rounded-full bg-accent/10 blur-[110px] dark:bg-accent/[0.07]"
        animate={
          shouldReduceMotion ? undefined : { x: [0, -25, 0], y: [0, -25, 0] }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
