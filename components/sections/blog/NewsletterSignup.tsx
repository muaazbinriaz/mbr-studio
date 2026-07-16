"use client";

import { useRef, useState, useTransition } from "react";
import { Mail, Check } from "lucide-react";
import { subscribeToNewsletter } from "@/app/(marketing)/blog/actions";

/**
 * Newsletter capture backed by Supabase (`newsletter_subscribers` table).
 * No paid email platform — this list is stored for later use once the
 * AI SaaS product launches. No emails are sent from this flow.
 */
export function NewsletterSignup() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        formRef.current?.reset();
      }
    });
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="rounded-3xl border border-border bg-card p-8 text-center md:p-10"
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
      >
        <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <h2
        id="newsletter-heading"
        className="font-heading text-xl font-bold text-text md:text-2xl"
      >
        Get new articles in your inbox
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-secondary-text">
        Join our newsletter and receive practical tips about websites, AI
        automation, and business growth — no spam, unsubscribe anytime.
      </p>

      {submitted ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
          <Check className="h-4 w-4" aria-hidden="true" />
          You&apos;re on the list — thanks for subscribing.
        </p>
      ) : (
        <form
          ref={formRef}
          action={handleSubmit}
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="you@business.com"
            disabled={isPending}
            className="h-11 flex-1 rounded-lg border border-border bg-background py-2 px-4 text-sm leading-none text-text placeholder:text-secondary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-11 shrink-0 rounded-lg bg-gradient-to-b from-primary to-primary/90 px-5 text-sm font-medium text-primary-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60"
          >
            {isPending ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 font-body text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
