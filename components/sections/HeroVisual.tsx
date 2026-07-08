// components/sections/HeroVisual.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

/**
 * Step 1 redesign: new hero visual, hidden below `lg`.
 *
 * The eyebrow copy already says "try it live below" — this gives visitors
 * a preview of what that AI agent actually looks like before they scroll,
 * instead of the hero being text-only. Pure CSS/SVG, no image assets, so
 * it costs nothing extra to load. Uses the new `.glass-card` /
 * `.animated-border` utilities added to globals.css — see that diff.
 *
 * This is a static, non-interactive preview (aria-hidden) — it is NOT a
 * duplicate chat widget. The real widget (ChatWindow.tsx) still owns all
 * actual chat functionality.
 */
export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      aria-hidden="true"
      className="animated-border glass-card hidden w-[320px] shrink-0 flex-col gap-3 rounded-xl p-5 shadow-lg lg:flex"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">MBR Assistant</p>
          <p className="text-xs text-secondary-text">Online now</p>
        </div>
      </div>

      <div className="rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text">
        Hey! Want to see what we can automate for your business?
      </div>
      <div className="ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
        Yes — show me a demo
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text">
        <Sparkles className="h-3 w-3 text-accent" />
        Typing…
      </div>
    </motion.div>
  );
}
