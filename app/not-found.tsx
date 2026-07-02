import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | MBR Studio",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-center bg-background">
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 text-center">
        <p className="font-heading text-6xl font-bold tracking-tight text-primary sm:text-7xl">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-white sm:text-3xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-3 font-body text-base text-secondary-text">
          The page you&apos;re looking for may have been moved or never existed.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-body text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Return home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-body text-sm font-medium text-white transition-colors duration-200 hover:bg-card"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
