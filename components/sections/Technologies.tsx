"use client";

import { FadeIn } from "@/components/animations/FadeIn";
import { useReducedMotion } from "framer-motion";
import {
  Layers,
  Atom,
  FileCode2,
  Palette,
  Sparkles,
  Component,
  Blocks,
  Shapes,
  Database,
  Bot,
  Gem,
  Network,
  ListChecks,
  ShieldCheck,
  Mail,
  Triangle,
} from "lucide-react";

/**
 * Technologies — infinite horizontal scroll ("Vercel/Stripe/Linear-style"
 * tech strip). List is generated ONLY from technologies actually present
 * in package.json — nothing fabricated.
 *
 * Icons are generic lucide-react glyphs (not brand logo marks) — keeps us
 * clear of trademarked assets while still giving each item a visual anchor.
 * Track is duplicated once internally for a seamless loop; only the CSS
 * animation (.tech-marquee-track, in globals.css) moves it, so it stays
 * GPU-accelerated and respects prefers-reduced-motion automatically.
 */

const STACK = [
  { name: "Next.js", icon: Layers },
  { name: "React", icon: Atom },
  { name: "TypeScript", icon: FileCode2 },
  { name: "Tailwind CSS", icon: Palette },
  { name: "Framer Motion", icon: Sparkles },
  { name: "Radix UI", icon: Component },
  { name: "shadcn/ui", icon: Blocks },
  { name: "Lucide Icons", icon: Shapes },
  { name: "Supabase", icon: Database },
  { name: "Anthropic Claude", icon: Bot },
  { name: "Google Gemini", icon: Gem },
  { name: "OpenRouter", icon: Network },
  { name: "React Hook Form", icon: ListChecks },
  { name: "Zod", icon: ShieldCheck },
  { name: "Resend", icon: Mail },
  { name: "Vercel", icon: Triangle },
] as const;

function StackRow({ keyPrefix }: { keyPrefix: string }) {
  return (
    <span className="flex items-center">
      {STACK.map((tech) => (
        <span
          key={`${keyPrefix}-${tech.name}`}
          className="mx-5 flex items-center gap-2.5 whitespace-nowrap sm:mx-7"
        >
          <tech.icon
            className="h-5 w-5 flex-none text-primary/70 transition-colors duration-200 sm:h-5 sm:w-5"
            aria-hidden="true"
          />
          <span className="font-heading text-base font-semibold tracking-tight text-secondary-text transition-colors duration-200 sm:text-lg">
            {tech.name}
          </span>
        </span>
      ))}
    </span>
  );
}

export function Technologies() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <FadeIn>
          <p className="mb-10 text-center font-body text-sm font-medium tracking-wide text-secondary-text">
            Built with Modern Technologies
          </p>
        </FadeIn>

        {shouldReduceMotion ? (
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
            {STACK.map((tech) => (
              <span
                key={tech.name}
                className="flex items-center gap-2.5 whitespace-nowrap"
              >
                <tech.icon
                  className="h-5 w-5 flex-none text-primary/70"
                  aria-hidden="true"
                />
                <span className="font-heading text-base font-semibold tracking-tight text-secondary-text sm:text-lg">
                  {tech.name}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div
            className="group relative w-full overflow-hidden"
            role="presentation"
            aria-hidden="true"
          >
            {/* Fade edges so items don't hard-cut at the container edge */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-28" />

            {/* Only this element moves; pauses on hover via CSS (see
                .tech-marquee-track in globals.css) */}
            <div className="tech-marquee-track flex w-max whitespace-nowrap">
              <StackRow keyPrefix="a" />
              <StackRow keyPrefix="b" />
            </div>
          </div>
        )}

        {/* Screen-reader friendly, non-animated list — the marquee above
            is aria-hidden since it's decorative/duplicated content */}
        <span className="sr-only">
          Technologies used: {STACK.map((t) => t.name).join(", ")}
        </span>
      </div>
    </section>
  );
}
