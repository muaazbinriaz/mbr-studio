// components/sections/MarqueeStrip.tsx
"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Full-bleed scrolling ticker placed between Hero and ProblemStatement.
 *
 * v3 fix: emoji used to sit *inside* the `.text-gradient-animated` span,
 * which uses `background-clip: text` + `color: transparent` — that
 * strips emoji of their native multi-color glyph in several browsers,
 * making every emoji render as one flat tint instead of its real colors.
 * Fixed by pulling the emoji into its own plain (non-gradient) span per
 * item, so each one keeps its own native color, while only the
 * surrounding words get the animated gradient treatment.
 *
 * Copy refreshed to be distinct from the Hero pill's phrases (no more
 * repeating "AI agent in action" in both places).
 */

const MARQUEE_ITEMS: { emoji: string; text: string }[] = [
  { emoji: "🚀", text: "From idea to launch in weeks, not months" },
  { emoji: "🌐", text: "Websites, SaaS products & landing pages that convert" },
  {
    emoji: "🤖",
    text: "AI chat agents & WhatsApp automation, when you need them",
  },
  { emoji: "🔐", text: "Client-owned code & accounts, always" },
  { emoji: "⚡", text: "Built by one senior engineer — no bloated agency" },
];

const SEPARATOR = "✦";

function MarqueeLine({ keyPrefix }: { keyPrefix: string }) {
  return (
    <span className="mx-3 flex items-center whitespace-nowrap">
      {MARQUEE_ITEMS.map((item, i) => (
        <span
          key={`${keyPrefix}-${i}`}
          className="mx-3 flex items-center gap-2 whitespace-nowrap"
        >
          {/* Emoji stays outside the gradient span so it keeps its own
              native color instead of being flattened by background-clip. */}
          <span className="text-base sm:text-lg" aria-hidden="true">
            {item.emoji}
          </span>
          <span className="text-gradient-animated text-sm font-bold tracking-wide sm:text-base">
            {item.text}
          </span>
          <span className="mx-1 text-xs text-accent/60 sm:text-sm">
            {SEPARATOR}
          </span>
        </span>
      ))}
    </span>
  );
}

export function MarqueeStrip() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="relative border-y border-primary/25 bg-card/60 py-3 text-center">
        <span className="inline-flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            {MARQUEE_ITEMS[0].emoji}
          </span>
          <span className="text-gradient-animated text-sm font-bold sm:text-base">
            {MARQUEE_ITEMS[0].text}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-card/60 py-3.5 backdrop-blur-sm"
      role="presentation"
      aria-hidden="true"
    >
      {/* Static gradient top/bottom borders — frame never moves */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

      {/* Fade edges so text doesn't hard-cut at the viewport edge */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />

      {/* Only this element moves */}
      <div className="marquee-track flex w-max whitespace-nowrap">
        <MarqueeLine keyPrefix="a" />
        <MarqueeLine keyPrefix="b" />
      </div>
    </div>
  );
}
