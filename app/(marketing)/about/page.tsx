import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Technologies } from "@/components/sections/Technologies";
import { Button } from "@/components/ui/button";
import { StatsBar } from "@/components/sections/StatsBar";

/**
 * About Page — Prompt 15, SEO pass in Prompt 20.
 *
 * Blueprint ref: Part 2, Section 9 (founder intro, philosophy, what
 * working with MBR Studio looks like, technology logos, closing CTA).
 * I don't have Part 2's exact text in this session, so section content
 * and order below are inferred from the names you gave — flag if the
 * real spec structures any of these differently.
 *
 * A NOTE ON THE FOUNDER BIO: I wrote the philosophy and "what it's like
 * to work with us" copy in full, in MBR's voice — but I did not
 * invent specific biographical facts (years of experience, past
 * employers, client names, project counts) for Muaaz, since I have no
 * real information about his background and fabricating credentials on
 * a real business site would be dishonest. The intro paragraph below
 * has a bracketed placeholder — swap it for the real specifics and the
 * rest of the copy will read as intended.
 *
 * SEO PASS: title trimmed to just the topic — the root layout's title
 * template now appends "| MBR Studio — Websites & AI Automation", so
 * the old hardcoded "About | MBR Studio" would have rendered as
 * "About | MBR Studio | MBR Studio — Websites & AI Automation". See
 * layout.tsx for the full fix. Canonical URL added per Blueprint
 * Part 2 Section 13.
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "MBR Studio is a digital product studio founded by Muaaz Bin Riaz (BSCS). He has built modern web apps including a Trello-style productivity app (MERN), a job hunting platform (MERN + Next.js), and a Skin Clinic site (Next.js + TypeScript). MBR Studio helps Pakistani businesses grow online through automation, AI chatbots, and professional websites — with a vision to scale into a full software agency.",
  alternates: {
    canonical: "/about",
  },
};

const PHILOSOPHY = [
  {
    title: "Senior-led, always",
    description:
      "There's no bench of juniors your project gets quietly handed to. The person who scopes your build is the person who builds it.",
  },
  {
    title: "Engineering rigor over guesswork",
    description:
      "Decisions are made from performance budgets, real user flows, and what the stack can actually support — not whatever looked good in a template.",
  },
  {
    title: "Business outcomes over vanity metrics",
    description:
      "A beautiful site that doesn't convert is a failed project. Every design and technical decision gets traced back to what it does for your pipeline.",
  },
];

const WORKING_WITH_US = [
  "Direct access to the person building your product — no account managers relaying messages.",
  "Scope and timeline locked in writing before any code is written.",
  "Regular, specific updates — not radio silence between kickoff and delivery.",
  "You own the code, the assets, and the accounts. Nothing is held hostage after launch.",
];

export default function AboutPage() {
  return (
    <>
      {/* Founder intro */}
      <section className="bg-background">
        <div className="mx-auto max-w-5xl page-hero-pad">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            About
          </p>
          <h1
            className="max-w-3xl font-heading text-h1-secondary font-bold leading-tight tracking-tight text-text
"
          >
            {
              "A studio built around one engineer's standards, not a growing headcount."
            }
          </h1>
          <p className="mt-4 max-w-2xl font-body text-lg text-secondary-text">
            Muaaz Bin Riaz builds websites, AI chatbots, and automation for
            growing businesses — no account managers, no bench of juniors.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-[auto_1fr] md:items-start md:gap-12">
            <div className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl border border-border bg-card md:h-24 md:w-24">
              <Image
                src="/images/muaaz.jpg"
                alt="Muaaz Bin Riaz, founder of MBR Studio"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            <div className="max-w-2xl">
              <p className="font-body text-base leading-relaxed text-secondary-text sm:text-lg">
                MBR Studio is founded and led by Muaaz Bin Riaz.{" "}
                <span className="text-text">
                  With a Bachelor&apos;s degree in Computer Science (BSCS), he
                  has built modern web applications including a Trello-style
                  productivity app (MERN), a job hunting platform (MERN +
                  Next.js), and a Skin Clinic website (Next.js + TypeScript).
                  His focus is on helping Pakistani businesses automate customer
                  support and grow online through professional digital products.
                  Muaaz&apos;s long-term vision is to establish a startup and
                  eventually scale MBR Studio into a full software agency.
                </span>
              </p>

              <p
                className="mt-5 font-body text-base leading-relaxed text-secondary-text
 sm:text-lg"
              >
                MBR Studio exists because most businesses are stuck choosing
                between a freelancer who disappears after launch and an agency
                that puts a project manager between them and the person actually
                writing the code. This is neither — one senior engineer,
                directly responsible for what gets shipped.
              </p>
            </div>
          </div>
        </div>
      </section>

      <StatsBar />

      {/* Philosophy */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-28">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            Philosophy
          </p>
          <h2
            className="mb-12 max-w-2xl font-heading text-h2-section font-bold leading-tight tracking-tight text-text
"
          >
            How decisions actually get made here.
          </h2>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {PHILOSOPHY.map((item) => (
              <div key={item.title}>
                <h3 className="mb-3 font-heading text-lg font-semibold text-text">
                  {item.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-secondary-text">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What working with MBR Studio looks like */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,320px)_1fr] md:gap-16">
            <div>
              <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
                Working together
              </p>
              <h2
                className="font-heading text-h2-section font-bold leading-tight tracking-tight text-text
"
              >
                What working with MBR Studio looks like.
              </h2>
            </div>

            <ul className="space-y-5">
              {WORKING_WITH_US.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    className="mt-1 h-4 w-4 flex-none text-accent"
                    strokeWidth={2.5}
                  />
                  <span className="font-body text-base leading-relaxed text-text">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Technology logos — reuses the same strip from the home page */}
      <Technologies />

      {/* Closing CTA */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <h2
            className="font-heading text-h2-section font-bold leading-tight tracking-tight text-text
"
          >
            Let&apos;s talk about what you&apos;re building.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base text-secondary-text">
            No sales team, no handoff — you&apos;ll be talking directly with
            Muaaz from the first message.
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
