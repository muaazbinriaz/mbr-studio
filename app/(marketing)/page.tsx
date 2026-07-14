// import type { Metadata } from "next";
// import { FAQ } from "@/components/sections/Faq";
// import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
// import { Hero } from "@/components/sections/Hero";
// import { ProblemStatement } from "@/components/sections/ProblemStatement";
// import { Process } from "@/components/sections/Process";
// import { Services } from "@/components/sections/Services";
// import { Technologies } from "@/components/sections/Technologies";
// import { Testimonials } from "@/components/sections/Testimonials";
// import { StatsBar } from "@/components/sections/StatsBar";
// import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
// import { testimonials } from "@/data/testimonials";

// /**
//  * Home Page — SEO pass (Prompt 20).
//  *
//  * No `title` field here on purpose: root layout's `metadata.title.default`
//  * already holds the full brand title ("MBR Studio — Digital products, built
//  * to grow your business."). Next.js only applies `title.template` to a title
//  * a page explicitly *sets* — it does not apply to `default`. If this page
//  * set its own title (even "Home"), the template would append the site
//  * suffix on top of it, producing the same duplication bug that was fixed on
//  * services/about. Description + canonical are still page-specific per
//  * Blueprint Part 2 Section 13, since those aren't inherited from `default`
//  * the same way title is.
//  *
//  * No Organization JSON-LD here either — it's rendered once, sitewide, in
//  * root layout.tsx, not repeated per-page.
//  */
// export const metadata: Metadata = {
//   description:
//     "MBR Studio is a premium software agency building websites, AI-powered automation, and digital products for growing businesses.",
//   alternates: {
//     canonical: "/",
//   },
// };

// export default function Home() {
//   return (
//     <>
//       <Hero />
//       <ProblemStatement />
//       <Services />
//       <FeaturedProjects />
//       <Process />
//       <WhyChooseUs />
//       <Technologies />
//       {testimonials.length > 0 ? <Testimonials /> : <StatsBar />}
//       <FAQ />
//     </>
//   );
// }

import type { Metadata } from "next";
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
    "MBR Studio is a premium software agency building websites, AI-powered automation, and digital products for growing businesses.",
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
    </>
  );
}
