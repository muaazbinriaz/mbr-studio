"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

// Root-level safety net: catches any uncaught error not already
// handled by a more specific error.tsx (marketing, admin, auth,
// dashboard). Mirrors dashboard/error.tsx for tone/structure.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[root]", error);
  }, [error]);

  return (
    <section className="flex min-h-[80vh] items-center bg-background">
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-semibold text-text sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 font-body text-base text-secondary-text">
          This is on our end, not something you did. Try again, and if it keeps
          happening let us know.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-body text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-body text-sm font-medium text-text transition-colors duration-200 hover:bg-card"
          >
            <Home className="h-4 w-4" strokeWidth={1.75} />
            Back to homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
