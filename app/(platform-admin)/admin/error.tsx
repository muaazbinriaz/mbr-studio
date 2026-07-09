"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          Try again
        </button>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-body text-sm font-medium text-foreground transition-colors hover:bg-card"
        >
          Back to Admin Overview
        </Link>
      </div>
    </div>
  );
}
