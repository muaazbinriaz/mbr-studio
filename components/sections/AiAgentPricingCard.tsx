"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { PLANS } from "@/lib/billing/plans";

type Plan = (typeof PLANS)[keyof typeof PLANS];

export function AiAgentPricingCard({
  plan,
  featured,
  index,
}: {
  plan: Plan;
  featured: boolean;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <FadeIn
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className={[
        "group relative min-w-0 rounded-2xl border bg-card p-8 shadow-sm transition-colors duration-200",
        featured ? "border-primary" : "border-border hover:border-primary/50",
      ].join(" ")}
    >
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg shadow-primary/30">
          Most Popular
        </Badge>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative min-w-0">
        <h3 className="mb-1 font-heading text-lg font-semibold text-text">
          {plan.label}
        </h3>

        {/* min-w-0 + overflow-hidden stop the flex/grid parent from
            being pushed wider by this text. clamp() makes the font
            fluid so it always fits the card, on every screen size. */}
        <p className="mb-6 flex min-w-0 flex-wrap items-baseline gap-x-1 overflow-hidden font-heading font-bold text-text">
          <span
            className="break-words leading-tight"
            style={{ fontSize: "clamp(1.5rem, 6cqi, 1.875rem)" }}
          >
            {formatCurrency(plan.priceMonthlyPKR, "PKR")}
          </span>
          <span className="font-body text-sm font-normal text-secondary-text">
            /month
          </span>
        </p>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Check
              className="mt-0.5 h-4 w-4 flex-none text-accent"
              strokeWidth={2.5}
            />
            <span className="font-body text-sm text-text">
              {plan.monthlyMessageLimit.toLocaleString()} messages / month
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check
              className="mt-0.5 h-4 w-4 flex-none text-accent"
              strokeWidth={2.5}
            />
            <span className="font-body text-sm text-text">
              Up to {plan.maxAgents} agent{plan.maxAgents > 1 ? "s" : ""}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check
              className="mt-0.5 h-4 w-4 flex-none text-accent"
              strokeWidth={2.5}
            />
            <span className="font-body text-sm text-text capitalize">
              {plan.channels.join(", ")}
            </span>
          </li>
        </ul>

        <Button
          asChild
          variant={featured ? "default" : "outline"}
          className="mt-8 w-full rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
        >
          <Link href="/signup">Start with {plan.label}</Link>
        </Button>
      </div>
    </FadeIn>
  );
}
