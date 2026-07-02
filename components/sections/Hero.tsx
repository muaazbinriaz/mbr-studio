// components/sections/Hero.tsx (Server Component — no "use client")

import { HeroAmbient } from "./HeroAmbient";
import { HeroEyebrow } from "./HeroEyebrow";
import { HeroSubAndCta } from "./HeroSubAndCta";

/**
 * PERFORMANCE PASS (Prompt 21): Hero itself is now a Server Component.
 * Only the three pieces that actually animate (ambient orbs, eyebrow
 * fade-in, subheading+CTA fade-in) are client islands, in their own
 * files. The h1 headline — the largest, most important element on the
 * page — ships zero client JS. React hydrates the three islands
 * independently rather than the whole Hero as one client bundle.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <HeroAmbient />

      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 py-32 md:px-10">
        <HeroEyebrow />

        <h1 className="max-w-4xl font-heading text-[36px] font-bold leading-[1.05] tracking-tight text-text sm:text-[44px] md:text-[64px] lg:text-[72px] xl:text-[80px]">
          Websites and AI automation,{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            engineered to convert.
          </span>
        </h1>

        <HeroSubAndCta />
      </div>
    </section>
  );
}
