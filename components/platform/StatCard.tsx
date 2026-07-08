import type { ComponentType } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Reusable stat tile for admin/client overview pages.
 *
 * IMPORTANT — only pass real numbers into `value`. Prompt 01's overview
 * pages are intentionally honest empty states ("Prompt 03 will populate
 * this"); this component doesn't change that contract — it's just a
 * nicer container. Don't invent placeholder numbers to make a page look
 * more populated than it is (see admin/page.tsx and dashboard/page.tsx
 * for the real-count query pattern this is meant to be used with).
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  badgeLabel,
  badgeVariant = "success",
  accent = "primary",
  trend,
  trendSuffix = "vs last period",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
  badgeLabel?: string;
  badgeVariant?: "success" | "warning" | "secondary" | "outline";
  accent?: "primary" | "accent";
  trend?: number | null;
  trendSuffix?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
      )}
    >
      {/* Corner glow, fades in on hover — same technique as Services.tsx cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_0_0_1px_rgba(99,102,241,0.12),0_8px_30px_-8px_rgba(99,102,241,0.3)] transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            accent === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-accent/10 text-accent",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {badgeLabel && (
          <Badge variant={badgeVariant} className="text-xs">
            {badgeLabel}
          </Badge>
        )}
      </div>

      <p className="relative mt-5 font-heading text-3xl font-bold text-foreground">
        {value}
      </p>
      <div className="relative mt-1 flex items-center gap-1.5">
        <p className="font-body text-sm text-secondary-text">{label}</p>
        {trend !== undefined &&
          (trend === null ? (
            <span className="font-body text-xs text-secondary-text">(New)</span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-0.5 font-body text-xs font-medium",
                trend > 0 && "text-success",
                trend < 0 && "text-destructive",
                trend === 0 && "text-secondary-text",
              )}
              title={trendSuffix}
            >
              {trend > 0 && <ArrowUp className="h-3 w-3" strokeWidth={2} />}
              {trend < 0 && <ArrowDown className="h-3 w-3" strokeWidth={2} />}
              {trend === 0 ? "flat" : `${Math.abs(Math.round(trend))}%`}
            </span>
          ))}
      </div>

      {/* Bottom accent line, draws in on hover */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
          accent === "primary" ? "bg-primary" : "bg-accent",
        )}
      />
    </div>
  );
}
