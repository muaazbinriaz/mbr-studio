// // components/sections/HeroEyebrow.tsx
// "use client";

// import { motion, useReducedMotion } from "framer-motion";
// import { Sparkles } from "lucide-react";

// /**
//  * Step 1 redesign: was a plain line of text. Now a glass pill badge with
//  * a live-pulse dot + sparkle icon — the "glassmorphism / premium badge"
//  * treatment from the redesign brief, applied to the single most-seen
//  * element on the site.
//  */
// export function HeroEyebrow() {
//   const shouldReduceMotion = useReducedMotion();

//   return (
//     <motion.div
//       initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4 }}
//       className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-1.5 text-sm font-medium text-secondary-text shadow-sm backdrop-blur-md"
//     >
//       <span className="relative flex h-2 w-2" aria-hidden="true">
//         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none" />
//         <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
//       </span>
//       <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
//       Web Development Agency + the AI Chat Agent behind it — try it live below
//     </motion.div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * Glass pill badge above the H1. Rotates through a short set of phrases
 * with a smooth opacity+slide crossfade, one line at all times. Text uses
 * the shared `.text-gradient-animated` utility (globals.css).
 *
 * v3: refreshed copy so it doesn't repeat the marquee strip's wording —
 * pill = the 3 headline positioning statements, marquee (MarqueeStrip.tsx)
 * = the punchy feature/benefit ticker below it. Kept to 3 phrases so the
 * rotation stays quick to read.
 *
 * Respects prefers-reduced-motion: shows the first phrase only, statically,
 * no interval/shimmer runs.
 */

const PHRASES = [
  "🚀 Web Development Agency + the AI Agent behind it — try it live below",
  "💬 Websites, AI Chatbots & WhatsApp Automation — built by one senior engineer",
  "✨ See the AI agent in action — right there in the corner →",
];

// Widest phrase — reserves a fixed width via an invisible sizer below so
// the pill never resizes as phrases rotate, which is what was shifting
// the HeroVisual card left/right.
const LONGEST_PHRASE = PHRASES.reduce((a, b) => (b.length > a.length ? b : a));

const PHRASE_DURATION = 4200; // ms each phrase stays visible

export function HeroEyebrow() {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length);
    }, PHRASE_DURATION);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-6 inline-flex w-fit max-w-full items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-full border border-primary/30 bg-card/60 px-5 py-2 text-base font-semibold shadow-sm backdrop-blur-md sm:text-lg"
    >
      {/* Slow diagonal shimmer sweep — purely decorative, sits behind the text */}
      {!shouldReduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2,
          }}
        />
      )}

      <span className="relative flex h-2.5 w-2.5 flex-none" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <Sparkles className="h-4 w-4 flex-none text-primary" aria-hidden="true" />

      <span className="relative inline-grid">
        {/* Invisible sizer holding the longest phrase — locks the pill's
            width permanently so it can never grow/shrink on rotation. */}
        <span
          className="invisible col-start-1 row-start-1 whitespace-nowrap"
          aria-hidden="true"
        >
          {LONGEST_PHRASE}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={shouldReduceMotion ? "static" : index}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`col-start-1 row-start-1 whitespace-nowrap ${
              shouldReduceMotion ? "text-primary" : "text-gradient-animated"
            }`}
          >
            {shouldReduceMotion ? PHRASES[0] : PHRASES[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  );
}
