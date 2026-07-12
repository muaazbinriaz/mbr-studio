// components/sections/ServiceVisual.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Check, MessageCircle, Sparkles } from "lucide-react";

/**
 * Per-service product mockup for the /services page.
 *
 * Same technique as HeroVisual.tsx (glass-card / animated-border /
 * gradient-ring utilities, brand tokens only, no image assets) — extended
 * to six distinct variants so each service section shows something that
 * actually resembles the thing being sold, instead of empty card space
 * next to a bullet list. Purely decorative (aria-hidden); the real
 * "What's included" list next to it still carries the actual information.
 */
export function ServiceVisual({ slug }: { slug: string }) {
  const shouldReduceMotion = useReducedMotion();
  const fadeIn = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.5 },
      };

  switch (slug) {
    case "digital-product-development":
      return (
        <motion.div
          {...fadeIn}
          aria-hidden="true"
          className="glass-card gradient-ring w-full max-w-sm overflow-hidden rounded-xl shadow-lg"
        >
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-3 flex-1 truncate rounded-md bg-secondary-background px-2.5 py-1 text-[11px] text-secondary-text">
              yourbusiness.com
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="h-3 w-2/3 rounded bg-gradient-to-r from-primary to-accent opacity-80" />
            <div className="h-2 w-full rounded bg-secondary-background" />
            <div className="h-2 w-5/6 rounded bg-secondary-background" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-14 rounded-lg bg-secondary-background" />
              <div className="h-14 rounded-lg bg-secondary-background" />
              <div className="h-14 rounded-lg bg-secondary-background" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
              <Sparkles className="h-3 w-3" /> Core Web Vitals: 98
            </div>
          </div>
        </motion.div>
      );

    case "ai-business-automation":
      return (
        <motion.div
          {...fadeIn}
          aria-hidden="true"
          className="glass-card gradient-ring flex w-full max-w-sm flex-col gap-3 rounded-xl p-5 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Support Agent
              </p>
              <p className="text-xs text-secondary-text">
                Trained on your docs
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text">
            Do you offer refunds after 30 days?
          </div>
          <div className="ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
            Our policy covers returns within 30 days — I can start that for you
            now.
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            <Check className="h-3 w-3" /> Resolved without a human
          </div>
        </motion.div>
      );

    case "whatsapp-automation":
      // Brand-token colors throughout — intentionally not WhatsApp's
      // official green, to stay on-brand rather than borrowing another
      // product's identity.
      return (
        <motion.div
          {...fadeIn}
          aria-hidden="true"
          className="glass-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Booking Assistant
              </p>
              <p className="text-xs text-secondary-text">via WhatsApp</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="max-w-[85%] rounded-lg rounded-tl-none bg-secondary-background px-3 py-2 text-xs text-secondary-text">
              Hi! I&apos;d like to book a table for 4 on Friday
            </div>
            <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-primary px-3 py-2 text-xs text-primary-foreground">
              Got it — Friday, 4 guests. 7:00 PM or 8:30 PM?
            </div>
            <div className="max-w-[85%] rounded-lg rounded-tl-none bg-secondary-background px-3 py-2 text-xs text-secondary-text">
              7:00 works
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            <Check className="h-3 w-3" /> Booking confirmed · 0 staff time
          </div>
        </motion.div>
      );

    case "landing-pages":
      return (
        <motion.div
          {...fadeIn}
          aria-hidden="true"
          className="glass-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
        >
          <div className="mx-auto flex w-40 flex-col items-center gap-2 rounded-2xl border border-border bg-secondary-background p-3">
            <div className="h-2 w-16 rounded bg-gradient-to-r from-primary to-accent" />
            <div className="h-1.5 w-24 rounded bg-border" />
            <div className="h-1.5 w-20 rounded bg-border" />
            <div className="mt-2 h-6 w-24 rounded-md bg-primary" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary-background px-3 py-2">
            <span className="text-[11px] text-secondary-text">
              Conversion rate
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <Sparkles className="h-3 w-3" /> +38%
            </span>
          </div>
        </motion.div>
      );

    case "saas-development":
      return (
        <motion.div
          {...fadeIn}
          aria-hidden="true"
          className="glass-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
        >
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary-background p-2">
              <p className="text-[10px] text-secondary-text">MRR</p>
              <p className="text-sm font-semibold text-foreground">$12.4k</p>
            </div>
            <div className="rounded-lg bg-secondary-background p-2">
              <p className="text-[10px] text-secondary-text">Users</p>
              <p className="text-sm font-semibold text-foreground">2,180</p>
            </div>
            <div className="rounded-lg bg-secondary-background p-2">
              <p className="text-[10px] text-secondary-text">Uptime</p>
              <p className="text-sm font-semibold text-foreground">99.9%</p>
            </div>
          </div>
          <div className="flex h-16 items-end gap-1.5 rounded-lg bg-secondary-background p-2">
            {[40, 65, 45, 80, 60, 95, 70].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-sm bg-gradient-to-t from-primary to-accent opacity-80"
              />
            ))}
          </div>
        </motion.div>
      );

    case "ui-ux-design":
      return (
        <motion.div
          {...fadeIn}
          aria-hidden="true"
          className="glass-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary" />
            <span className="h-6 w-6 rounded-full bg-accent" />
            <span className="h-6 w-6 rounded-full bg-success" />
            <span className="h-6 w-6 rounded-full border border-border bg-secondary-background" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-full rounded-md border border-border bg-secondary-background px-3" />
            <div className="flex gap-2">
              <div className="h-7 w-16 rounded-md bg-primary" />
              <div className="h-7 w-16 rounded-md border border-border bg-transparent" />
            </div>
          </div>
        </motion.div>
      );

    default:
      return null;
  }
}
