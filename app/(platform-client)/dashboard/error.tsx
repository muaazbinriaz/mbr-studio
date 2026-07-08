"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Next.js convention: this error boundary automatically wraps
// dashboard/page.tsx AND every nested route (knowledge-base, inbox,
// leads, channels, agent/guardrails, agent/templates, appearance,
// settings, billing, api-keys, webhooks) that doesn't define its own
// error.tsx. One file gives every dashboard page a real "Something
// went wrong, retry" state instead of Next's default crash screen.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-foreground">
          Something went wrong loading this page
        </p>
        <p className="mt-1 max-w-sm font-body text-sm text-secondary-text">
          This is on our end, not something you did. Try again, and if it keeps
          happening let us know.
        </p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
        Try again
      </button>
    </div>
  );
}
