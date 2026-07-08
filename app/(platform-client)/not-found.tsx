import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ClientNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-heading text-5xl font-bold tracking-tight text-primary">
        404
      </p>
      <h1 className="mt-4 font-heading text-xl font-semibold text-foreground">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-2 max-w-sm font-body text-sm text-secondary-text">
        It may have been moved, deleted, or you may not have access to it.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to Dashboard
      </Link>
    </div>
  );
}
