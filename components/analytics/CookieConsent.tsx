"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

const CONSENT_KEY = "mbr-analytics-consent";

export function CookieConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "granted" || stored === "denied") setConsent(stored);
  }, []);

  const decide = (value: "granted" | "denied") => {
    localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  };

  return (
    <>
      {consent === "granted" && <Analytics />}

      {consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-4 bottom-4 z-[200] flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:max-w-sm"
        >
          <p className="font-body text-sm text-foreground">
            We use cookies for analytics to understand how visitors use this
            site. You can accept or decline.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => decide("granted")}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decide("denied")}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}
