"use client";

import Link from "next/link";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

import { PlatformAmbient } from "./PlatformAmbient";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    text: "Launch a branded AI agent for any client in minutes",
  },
  {
    icon: ShieldCheck,
    text: "Row-level security keeps every tenant's data isolated",
  },
  {
    icon: Zap,
    text: "One dashboard for website, WhatsApp, and Instagram conversations",
  },
] as const;

/**
 * Replaces the old plain centered-card auth layout. Desktop gets a
 * branded left panel (product pitch, matches the Prompt 01 roadmap —
 * multi-tenant, RLS, omnichannel) so /login and /signup read like the
 * SaaS platform they're gating, not an afterthought bolted onto the
 * marketing site. Mobile collapses to a single column — the brand
 * panel disappears entirely rather than stacking above the form, so
 * the form is still the very first thing a mobile visitor sees.
 *
 * Used by app/(platform-auth)/layout.tsx, which wraps both
 * /login/page.tsx and /signup/page.tsx. Neither page needs to know
 * this layout exists — they just render their existing <Card> form
 * into `children` as before.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-background">
      <PlatformAmbient />

      {/* Left brand panel — desktop only */}
      <div className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-border bg-card/40 px-12 py-12 lg:flex">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          MBR Studio{" "}
          <span className="font-normal text-secondary-text">/ Platform</span>
        </Link>

        <div>
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            Multi-tenant AI Chatbot Platform
          </p>
          <h1 className="max-w-md font-heading text-3xl font-bold leading-tight tracking-tight text-foreground">
            Run every client&apos;s AI agent from one place.
          </h1>

          <div className="mt-10 flex flex-col gap-5">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <p className="pt-1.5 font-body text-sm leading-relaxed text-secondary-text">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="font-body text-xs text-secondary-text">
          © {new Date().getFullYear()} MBR Studio. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
        <Link
          href="/"
          className="mb-8 font-heading text-lg font-semibold tracking-tight text-foreground lg:hidden"
        >
          MBR Studio
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
