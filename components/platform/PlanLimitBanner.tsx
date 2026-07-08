import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";

/**
 * Sales-moment banner (Prompt 08, Section 6) — shown on the client
 * dashboard overview when their org is on trial, at/near their
 * message limit, or cancelled/suspended. Deliberately not styled as
 * an error state — this is framed as "upgrade to keep things running",
 * not a punishment.
 *
 * Usage (in app/(platform-client)/dashboard/page.tsx):
 *
 *   const { count: messagesThisMonth } = await supabase
 *     .from("messages").select("id", { count: "exact", head: true })
 *     .eq("organization_id", primaryOrgId).gte("created_at", monthStart);
 *
 *   <PlanLimitBanner
 *     status={org.status}
 *     monthlyMessageLimit={org.monthly_message_limit}
 *     messagesThisMonth={messagesThisMonth ?? 0}
 *   />
 */
export function PlanLimitBanner({
  status,
  monthlyMessageLimit,
  messagesThisMonth,
}: {
  status: string;
  monthlyMessageLimit: number;
  messagesThisMonth: number;
}) {
  const usageRatio =
    monthlyMessageLimit > 0 ? messagesThisMonth / monthlyMessageLimit : 0;

  if (status === "cancelled" || status === "suspended") {
    return (
      <Banner
        icon={AlertTriangle}
        tone="warning"
        title="Your chatbot is currently paused"
        description="Your plan isn't active, so your widget and connected channels have stopped responding. Reactivate to pick up right where you left off — none of your data was touched."
        ctaLabel="Reactivate plan"
      />
    );
  }

  if (status === "trial") {
    return (
      <Banner
        icon={Clock}
        tone="info"
        title="You're on a trial"
        description="Pick a plan to keep your chatbot responding beyond the trial period."
        ctaLabel="Choose a plan"
      />
    );
  }

  if (usageRatio >= 1) {
    return (
      <Banner
        icon={AlertTriangle}
        tone="warning"
        title="You're at your monthly message limit"
        description="Your chatbot has stopped responding to new messages this month — upgrade to keep it running."
        ctaLabel="Upgrade plan"
      />
    );
  }

  if (usageRatio >= 0.8) {
    return (
      <Banner
        icon={Clock}
        tone="info"
        title="Approaching your monthly message limit"
        description={`You've used ${messagesThisMonth.toLocaleString()} of ${monthlyMessageLimit.toLocaleString()} messages this month.`}
        ctaLabel="View plans"
      />
    );
  }

  return null;
}

function Banner({
  icon: Icon,
  tone,
  title,
  description,
  ctaLabel,
}: {
  icon: typeof AlertTriangle;
  tone: "warning" | "info";
  title: string;
  description: string;
  ctaLabel: string;
}) {
  // Slim left-accent STRIP (not a full padded card) — the checklist
  // above is the "onboarding task" card; this is the "commercial
  // nudge" and stays visually lighter so it doesn't read as another
  // checklist item.
  const toneClasses =
    tone === "warning"
      ? "border-l-warning bg-warning/[0.06] text-warning"
      : "border-l-primary bg-primary/[0.05] text-primary";

  return (
    <div
      className={`mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border-y border-r border-l-4 border-border/60 px-4 py-3 ${toneClasses}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 flex-none" strokeWidth={2} />
        <div>
          <span className="font-body text-sm font-medium text-foreground">
            {title}
          </span>
          <span className="ml-1.5 font-body text-xs text-secondary-text">
            {description}
          </span>
        </div>
      </div>
      <Link
        href="/dashboard/settings/billing"
        className="flex-none rounded-lg bg-primary px-3.5 py-1.5 font-body text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
