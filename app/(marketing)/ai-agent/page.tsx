import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { siteConfig } from "@/config/site";
import { PLANS } from "@/lib/billing/plans";
import { formatCurrency } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "AI Agent",
  description:
    "Try the exact AI agent MBR Studio builds for businesses — a live, working chatbot demo covering pricing, guardrails, lead capture, and setup.",
  alternates: {
    canonical: "/ai-agent",
  },
};

// TODO: replace with the real public_key from the "MBR Studio Demo"
// organization (Section 3 of the plan) once it's created — see
// embed_keys.public_key in the admin/onboarding flow.
const DEMO_WIDGET_PUBLIC_KEY = "REPLACE_WITH_REAL_DEMO_PUBLIC_KEY";

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Knowledge base",
    description:
      "Upload your docs, FAQs, or website content — the agent learns your business, not a generic script.",
  },
  {
    number: "02",
    title: "Guardrails",
    description:
      "Set rules for tone, topics to avoid, and when to hand off — so it only says what you'd approve.",
  },
  {
    number: "03",
    title: "Embed on your site",
    description:
      "One script tag. Works on any website, no developer required beyond pasting a line of code.",
  },
  {
    number: "04",
    title: "Conversations flow into your inbox",
    description:
      "Every chat lands in your dashboard — reply directly, or let the agent keep handling it.",
  },
] as const;

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Guardrails & safety rules",
    description:
      "Define what the agent can and can't say, and when it should stop and hand off to a human.",
  },
  {
    icon: Sparkles,
    title: "Lead capture",
    description:
      "Collects name, email, and intent mid-conversation — leads land in your dashboard automatically.",
  },
  {
    icon: MessageCircle,
    title: "Multi-channel",
    description:
      "Website live now, with WhatsApp, Instagram, and Messenger available depending on your plan.",
  },
  {
    icon: Inbox,
    title: "Human handoff & live inbox",
    description:
      "Jump into any conversation in real time when the agent needs a human, no context lost.",
  },
  {
    icon: BarChart3,
    title: "Analytics dashboard",
    description:
      "Track conversations, leads, and channel performance in one place.",
  },
  {
    icon: Bot,
    title: "Industry templates",
    description:
      "Start from a template tuned for your industry instead of a blank knowledge base.",
  },
] as const;

export default function AiAgentPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "AI Agent", url: `${siteConfig.url}/ai-agent` },
        ])}
      />

      {/* Real, live embeddable widget — scoped to this page only via
          next/script, not the root layout. */}
      <Script
        src="/chatbot.js"
        data-client={DEMO_WIDGET_PUBLIC_KEY}
        strategy="lazyOnload"
      />

      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10 md:py-32">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            AI Agent Platform
          </p>
          <h1 className="font-heading text-[36px] font-bold leading-tight tracking-tight text-text sm:text-[48px] md:text-[56px]">
            Give your business a 24/7 AI agent — try the exact one your
            customers would talk to, right now.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-body text-base text-secondary-text sm:text-lg">
            This isn&apos;t a mockup. The chat bubble on this page is the same
            widget technology we ship to real clients — configured here as our
            own demo agent. Open it and ask it anything about pricing, setup, or
            how it works.
          </p>
          <p className="mt-8 font-body text-sm text-secondary-text">
            Look for the chat bubble in the bottom-left corner of this page 👇
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              How it works
            </p>
            <h2 className="font-heading text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[40px]">
              From knowledge base to live conversations, in four steps.
            </h2>
          </div>
          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.number}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-heading text-xs font-semibold text-text">
                  {step.number}
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-text">
                  {step.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-secondary-text">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              What&apos;s included
            </p>
            <h2 className="font-heading text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[40px]">
              Everything a real client&apos;s agent ships with.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-8">
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-text">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm leading-relaxed text-secondary-text">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              Pricing
            </p>
            <h2 className="font-heading text-[32px] font-bold leading-tight tracking-tight text-text sm:text-[40px]">
              Simple, transparent plans as your business grows.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((planId) => {
              const plan = PLANS[planId];
              return (
                <Card
                  key={planId}
                  className={`p-8 ${planId === "growth" ? "border-primary" : ""}`}
                >
                  <h3 className="mb-1 font-heading text-lg font-semibold text-text">
                    {plan.label}
                  </h3>
                  <p className="mb-6 font-heading text-3xl font-bold text-text">
                    {formatCurrency(plan.priceMonthlyPKR, "PKR")}
                    <span className="ml-1 font-body text-sm font-normal text-secondary-text">
                      /month
                    </span>
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 flex-none text-accent"
                        strokeWidth={2.5}
                      />
                      <span className="font-body text-sm text-text">
                        {plan.monthlyMessageLimit.toLocaleString()} messages /
                        month
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 flex-none text-accent"
                        strokeWidth={2.5}
                      />
                      <span className="font-body text-sm text-text">
                        Up to {plan.maxAgents} agent
                        {plan.maxAgents > 1 ? "s" : ""}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 flex-none text-accent"
                        strokeWidth={2.5}
                      />
                      <span className="font-body text-sm text-text capitalize">
                        {plan.channels.join(", ")}
                      </span>
                    </li>
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <h2 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-text sm:text-[36px]">
            Want this for your business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            Tell us about your business and we&apos;ll set up an agent trained
            on your knowledge base, ready to embed on your site.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-lg px-7 py-6">
              <Link href="/contact">
                Book a Free Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
