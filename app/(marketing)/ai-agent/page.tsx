import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { AiAgentFeatureCard } from "@/components/sections/AiAgentFeatureCard";
import { AiAgentPricingCard } from "@/components/sections/AiAgentPricingCard";
import { Testimonials } from "@/components/sections/Testimonials";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { siteConfig } from "@/config/site";
import { PLANS } from "@/lib/billing/plans";
import { SuppressLauncherOnMount } from "@/components/chatbot/SuppressLauncherOnMount";

export const metadata: Metadata = {
  title: "AI Agent",
  description:
    "Try the exact AI agent MBR Studio builds for businesses — a live, working chatbot demo covering pricing, guardrails, lead capture, and setup.",
  alternates: {
    canonical: "/ai-agent",
  },
};

const DEMO_WIDGET_PUBLIC_KEY = process.env.NEXT_PUBLIC_DEMO_WIDGET_KEY || null;

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
    title: "Stays on-brand, every time",
    description:
      "Define what the agent can and can't say, and when it should stop and hand off to a human.",
  },
  {
    icon: Sparkles,
    title: "Never lose a lead again",
    description:
      "Collects name, email, and intent mid-conversation — leads land in your dashboard automatically.",
  },
  {
    icon: MessageCircle,
    title: "Meets customers where they are",
    description:
      "Website live now, with WhatsApp, Instagram, and Messenger available depending on your plan.",
  },
  {
    icon: Inbox,
    title: "Jump in anytime, no context lost",
    description:
      "Take over any conversation in real time when the agent needs a human.",
  },
  {
    icon: BarChart3,
    title: "Know exactly what's working",
    description:
      "Track conversations, leads, and channel performance in one place.",
  },
  {
    icon: Bot,
    title: "Live in minutes, not weeks",
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

      {DEMO_WIDGET_PUBLIC_KEY && (
        <>
          <Script
            src="/chatbot.js"
            data-client={DEMO_WIDGET_PUBLIC_KEY}
            strategy="lazyOnload"
          />
          <SuppressLauncherOnMount />
        </>
      )}

      {/* Hero */}
      <section className="bg-background">
        <FadeIn className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10 md:py-32">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            AI Agent Platform
          </p>
          <h1
            className="font-heading text-h1-primary font-bold leading-tight tracking-tight text-text
"
          >
            Give your business a 24/7 AI agent — try the exact one your
            customers would talk to, right now.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-body text-base text-secondary-text sm:text-lg">
            This isn&apos;t a mockup. The chat bubble on this page is the same
            widget technology we ship to real clients — configured here as our
            own demo agent. Open it and ask it anything about pricing, setup, or
            how it works.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-lg px-7 py-6">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg px-7 py-6"
            >
              <Link href="/contact">Book a Consultation</Link>
            </Button>
          </div>

          {DEMO_WIDGET_PUBLIC_KEY && (
            <p className="mt-6 font-body text-sm text-secondary-text">
              Or just look for the chat bubble in the bottom-right corner of
              this page 👇 — it&apos;s the same agent, live.
            </p>
          )}
        </FadeIn>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
              How it works
            </p>
            <h2
              className="font-heading text-h2-feature font-bold leading-tight tracking-tight text-text
"
            >
              From knowledge base to live conversations, in four steps.
            </h2>
          </div>
          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <FadeIn
                key={step.number}
                as="li"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-heading text-xs font-semibold text-text">
                  {step.number}
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-text">
                  {step.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-secondary-text">
                  {step.description}
                </p>
              </FadeIn>
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
            <h2
              className="font-heading text-h2-feature font-bold leading-tight tracking-tight text-text
"
            >
              Everything a real client&apos;s agent ships with.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <AiAgentFeatureCard
                  key={feature.title}
                  icon={<Icon className="h-5 w-5" strokeWidth={1.75} />}
                  title={feature.title}
                  description={feature.description}
                  index={index}
                />
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
            <h2
              className="font-heading text-h2-feature font-bold leading-tight tracking-tight text-text
"
            >
              Simple, transparent plans as your business grows.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map(
              (planId, index) => (
                <AiAgentPricingCard
                  key={planId}
                  plan={PLANS[planId]}
                  featured={planId === "growth"}
                  index={index}
                />
              ),
            )}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <Testimonials />

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:px-10">
          <p className="font-body text-sm text-secondary-text">
            Want to see it in a real business?{" "}
            <Link
              href="/case-studies"
              className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              Read our case studies
            </Link>
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-background">
        <FadeIn
          viewport={{ once: true, amount: 0.5 }}
          className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32"
        >
          <h2
            className="font-heading text-h2-section font-bold leading-tight tracking-tight text-text
"
          >
            Ready to give your business its own AI agent?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            Start free and configure it yourself, or book a call and we&apos;ll
            set it up with you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-lg px-7 py-6">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg px-7 py-6"
            >
              <Link href="/contact">Book a Consultation</Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
