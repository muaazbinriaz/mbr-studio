import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export interface EstimateOutput {
  budgetRangeUSD: [number, number];
  timelineWeeks: [number, number];
  recommendedFeatures: string[];
  recommendedPackage: string;
  nextStep: string;
}

export function EstimateCard({ estimate }: { estimate: EstimateOutput }) {
  const [minBudget, maxBudget] = estimate.budgetRangeUSD;
  const [minWeeks, maxWeeks] = estimate.timelineWeeks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="ml-9 max-w-[85%] overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2.5">
        <Calculator className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {estimate.recommendedPackage}
        </p>
      </div>

      <div className="p-4">
        <p className="font-heading text-xl font-bold text-foreground">
          {formatCurrency(minBudget)} – {formatCurrency(maxBudget)}
        </p>
        <p className="mt-1 font-body text-xs text-muted-foreground">
          Estimated timeline: {minWeeks}–{maxWeeks} week
          {maxWeeks === 1 ? "" : "s"}
        </p>

        {estimate.recommendedFeatures.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {estimate.recommendedFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 font-body text-sm text-foreground"
              >
                <span className="mt-0.5 text-accent">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 border-t border-border pt-3 font-body text-xs leading-relaxed text-muted-foreground">
          {estimate.nextStep}
        </p>
      </div>
    </motion.div>
  );
}
