import { ChatLauncherButton } from "@/components/chatbot/ChatLauncherButton";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  icons as lucideIcons,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

import { services } from "@/data/services";
import type { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceSchema } from "@/lib/seo/schemas";

/**
 * Services Page — Prompt 13, SEO pass in Prompt 20.
 *
 * Blueprint ref: Part 1, Section 1 (Services list) + Section 4
 * (Information Architecture: Services page, "Explain offerings in
 * depth", primary CTA "Get a quote", SEO intent: service-specific
 * keywords).
 *
 * data/services.ts only carries { slug, title, description, icon } —
 * enough for the home page cards, not enough for a full page that
 * needs to explain "what it includes" and "who it's for" per service.
 * Rather than invent new fields on the shared Service type (which
 * would ripple into the home page cards too), the extra copy for this
 * page lives in SERVICE_DETAILS below, keyed by slug, and is merged
 * with the base data at render time. If you'd rather these fields
 * live in data/services.ts directly, say so and I'll move them.
 *
 * SEO PASS: title trimmed to just the topic — the root layout's title
 * template now appends "| MBR Studio — Websites & AI Automation", so
 * hardcoding the suffix here would have duplicated it (see layout.tsx
 * comment for the bug this fixes). Added canonical URL and a Service
 * JSON-LD block per service, per Blueprint Part 2 Section 13.
 */

export const metadata: Metadata = {
  title: "Services",
  description:
    "Digital product development, AI automation, and design services engineered to grow your business — from websites to full SaaS builds.",
  alternates: {
    canonical: "/services",
  },
};

interface ServiceDetail {
  includes: string[];
  whoItsFor: string;
  ctaLabel: string;
}

const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  "digital-product-development": {
    includes: [
      "Custom marketing sites and web apps",
      "Responsive design across every device",
      "CMS or headless content setup",
      "Performance and Core Web Vitals optimization",
      "Deployment and hosting on Vercel",
    ],
    whoItsFor:
      "Businesses that need a fast, credible web presence built to convert — not a template site with your logo swapped in.",
    ctaLabel: "Start a project",
  },
  "ai-business-automation": {
    includes: [
      "Custom chatbot trained on your business",
      "Lead qualification and FAQ handling",
      "Integration with your CRM or inbox",
      "24/7 automated support coverage",
    ],
    whoItsFor:
      "Teams getting repetitive inbound questions that pull focus and time away from higher-value work.",
    ctaLabel: "Automate my inbox",
  },
  "whatsapp-automation": {
    includes: [
      "Automated booking and appointment flows",
      "Order status and support replies",
      "Broadcast and follow-up sequences",
      "Smooth handoff to a human when needed",
    ],
    whoItsFor:
      "Restaurants, clinics, salons, and local businesses whose customers already live on WhatsApp.",
    ctaLabel: "Set up WhatsApp automation",
  },
  "landing-pages": {
    includes: [
      "Single-purpose, conversion-focused design",
      "A/B-testable layout structure",
      "Fast turnaround — days, not weeks",
      "Built-in analytics and tracking setup",
    ],
    whoItsFor:
      "Campaigns, product launches, and paid traffic that need a page built to convert, not a full site.",
    ctaLabel: "Build a landing page",
  },
  "saas-development": {
    includes: [
      "Product discovery and technical scoping",
      "Full-stack build from prototype to production",
      "Authentication, billing, and dashboards",
      "Scalable architecture from day one",
    ],
    whoItsFor:
      "Founders turning an idea or working prototype into a real, production-ready product.",
    ctaLabel: "Scope my build",
  },
  "ui-ux-design": {
    includes: [
      "User research and usability testing",
      "Wireframes and high-fidelity prototypes",
      "Design systems built for handoff",
      "Accessibility built in from the start",
    ],
    whoItsFor:
      "Teams that need interfaces people trust and can actually use, backed by research rather than guesswork.",
    ctaLabel: "Start with design",
  },
};

export default function ServicesPage() {
  return (
    <>
      {/* One Service JSON-LD block per service, matching Blueprint
          Part 2 Section 13 ("Service schema on the Services page"). */}
      {services.map((service) => (
        <JsonLd
          key={service.slug}
          data={serviceSchema(
            service,
            `${siteConfig.url}/services#${service.slug}`,
          )}
        />
      ))}

      {/* Page header */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10 md:py-32">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            Services
          </p>
          <h1 className="font-heading text-[36px] font-bold leading-tight tracking-tight text-text sm:text-[48px] md:text-[56px]">
            Everything you need to build, automate, and grow.
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl font-body text-base text-secondary-text
 sm:text-lg"
          >
            Every engagement is senior-led, built on a modern stack, and scoped
            to your business — not sold off a fixed package.
          </p>
        </div>
      </section>

      {/* Service sections */}
      {services.map((service, index) => (
        <ServiceSection key={service.slug} service={service} index={index} />
      ))}

      {/* Closing CTA */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <HelpCircle className="mx-auto mb-5 h-8 w-8 text-primary" />
          <h2 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-text sm:text-[36px]">
            Not sure what you need?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            Tell our AI assistant what you&apos;re trying to build and
            we&apos;ll point you to the right service — or skip straight to a
            real conversation with the team.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-lg px-7 py-6">
              <ChatLauncherButton aria-describedby="chat-cta-hint">
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with our AI assistant
              </ChatLauncherButton>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg px-7 py-6"
            >
              <Link href="/contact">Contact us directly</Link>
            </Button>
          </div>
          <span id="chat-cta-hint" className="sr-only">
            Opens the AI assistant to help identify the right service for your
            project
          </span>
        </div>
      </section>
    </>
  );
}

function ServiceSection({
  service,
  index,
}: {
  service: Service;
  index: number;
}) {
  const detail = SERVICE_DETAILS[service.slug];
  const Icon =
    lucideIcons[service.icon as keyof typeof lucideIcons] ?? HelpCircle;
  const isEven = index % 2 === 0;

  return (
    <section
      id={service.slug}
      className={`border-t border-border ${
        isEven ? "bg-background" : "bg-secondary-background"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: identity + description + CTA */}
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h2 className="mb-4 font-heading text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl">
              {service.title}
            </h2>
            <p className="mb-6 max-w-md font-body text-base leading-relaxed text-secondary-text">
              {service.description}
            </p>

            {detail && (
              <p className="mb-8 max-w-md rounded-lg border border-border bg-card/60 px-4 py-3 font-body text-sm leading-relaxed text-secondary-text">
                <span className="font-semibold text-text">
                  Who it&apos;s for:{" "}
                </span>
                {detail.whoItsFor}
              </p>
            )}

            <Button asChild className="rounded-lg px-6">
              <Link href="/contact">{detail?.ctaLabel ?? "Get a quote"}</Link>
            </Button>
          </div>

          {/* Right: what's included */}
          {detail && (
            <div className="rounded-2xl border border-border bg-card p-8">
              <p className="mb-5 font-body text-sm font-semibold uppercase tracking-wide text-secondary-text">
                What&apos;s included
              </p>
              <ul className="space-y-4">
                {detail.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 h-4 w-4 flex-none text-accent"
                      strokeWidth={2.5}
                    />
                    <span className="font-body text-sm leading-relaxed text-text">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
