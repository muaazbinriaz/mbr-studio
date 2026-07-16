import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/data/blog";

export function PostNavigation({
  prev,
  next,
}: {
  prev: BlogPost | null;
  next: BlogPost | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="More articles"
      className="grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-secondary-text">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            Previous
          </span>
          <span className="font-heading text-sm font-semibold leading-snug text-text transition-colors group-hover:text-primary line-clamp-2">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-right transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:items-end"
        >
          <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-secondary-text">
            Next
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
          <span className="font-heading text-sm font-semibold leading-snug text-text transition-colors group-hover:text-primary line-clamp-2">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
