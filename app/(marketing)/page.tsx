import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FAQ } from "@/components/sections/Faq";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { Hero } from "@/components/sections/Hero";
import { MarqueeStrip } from "@/components/sections/MarqueeStrip";
import { ProblemStatement } from "@/components/sections/ProblemStatement";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { Technologies } from "@/components/sections/Technologies";
import { Testimonials } from "@/components/sections/Testimonials";
import { StatsBar } from "@/components/sections/StatsBar";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Button } from "@/components/ui/button";
import { testimonials } from "@/data/testimonials";

/**
 * Home Page — SEO pass (Prompt 20).
 *
 * No `title` field here on purpose: root layout's `metadata.title.default`
 * already holds the full brand title ("MBR Studio — Digital products, built
 * to grow your business."). Next.js only applies `title.template` to a title
 * a page explicitly *sets* — it does not apply to `default`. If this page
 * set its own title (even "Home"), the template would append the site
 * suffix on top of it, producing the same duplication bug that was fixed on
 * services/about. Description + canonical are still page-specific per
 * Blueprint Part 2 Section 13, since those aren't inherited from `default`
 * the same way title is.
 *
 * No Organization JSON-LD here either — it's rendered once, sitewide, in
 * root layout.tsx, not repeated per-page.
 *
 * MarqueeStrip sits directly under Hero (own full-bleed section, not
 * nested inside HeroEyebrow) — see MarqueeStrip.tsx for why it was moved
 * out of the hero itself.
 */
export const metadata: Metadata = {
  description:
    "MBR Studio is a boutique software studio building websites, SaaS products, and AI-powered automation for growing businesses.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <ProblemStatement />
      <Services />
      <FeaturedProjects />
      <Process />
      <WhyChooseUs />
      <Technologies />
      {testimonials.length > 0 ? <Testimonials /> : <StatsBar />}
      <FAQ />

      {/* Closing CTA — reused pattern from about/page.tsx, portfolio/page.tsx
          & case-studies/[slug]/page.tsx. The homepage was the one page in
          the funnel missing this: a visitor who scrolls all the way to FAQ
          is high-intent, but previously landed straight in the footer with
          no re-prompt to act. */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <h2 className="font-heading text-h2-section font-bold leading-tight tracking-tight text-text">
            Ready to build something that grows your business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            Let&apos;s talk about your project — no sales team, just a direct
            conversation with the person who&apos;ll build it.
          </p>
          <div className="mt-8 flex justify-center">
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
