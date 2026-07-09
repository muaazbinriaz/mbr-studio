"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[auth]", error);
  }, [error]);

  return (
    <Card className="border-border/80 shadow-xl shadow-black/[0.03] dark:shadow-black/20">
      <CardHeader className="items-center pb-2 pt-8 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <CardTitle className="text-xl">Something went wrong</CardTitle>
        <p className="mt-1 font-body text-sm text-secondary-text">
          We couldn&apos;t load this page. Try again, or head back to login.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-8">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          Try again
        </button>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 font-body text-sm font-medium text-text transition-colors hover:bg-card"
        >
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}
