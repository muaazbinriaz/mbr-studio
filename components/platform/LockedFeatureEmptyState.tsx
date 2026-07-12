// components/platform/LockedFeatureEmptyState.tsx
//
// Shown instead of a page's real content when a user navigates directly to
// a locked route pre-setup (e.g. bookmarked /dashboard/inbox). Never a blank
// page or empty table — always explains why and links back to the wizard.
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export function LockedFeatureEmptyState({
  feature,
  description,
}: {
  feature: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-body text-sm font-semibold text-foreground">
          Finish setup to unlock {feature}
        </p>
        <p className="mx-auto mt-1 max-w-sm font-body text-xs text-secondary-text">
          {description ??
            `${feature} will be here once your AI agent is live — it takes about five minutes to set up.`}
        </p>
      </div>
      <Link
        href="/dashboard/onboarding"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Continue setup
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
