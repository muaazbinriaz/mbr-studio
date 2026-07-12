// components/platform/ResumeOnboardingBanner.tsx
//
// Shown on /dashboard while setup isn't complete. Copy changes depending on
// whether the user has actually made progress (resume) or hasn't started
// (fresh start) — "pick up where you left off" would be a lie at step 0.
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const STEP_LABELS = [
  "Name & Personality",
  "Train",
  "Behavior",
  "Look & Feel",
  "Go live",
];

export function ResumeOnboardingBanner({ step }: { step: number }) {
  const started = step > 0;
  const clampedStep = Math.min(Math.max(step, 0), STEP_LABELS.length - 1);

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-foreground">
            {started
              ? "Pick up where you left off"
              : "Let's get your AI agent set up"}
          </p>
          <p className="mt-0.5 font-body text-xs text-secondary-text">
            {started
              ? `You're on step ${clampedStep + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[clampedStep]}.`
              : "Five quick steps — you'll see your live widget the whole way through."}
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/onboarding"
        className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {started ? "Continue setup" : "Start setup"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
