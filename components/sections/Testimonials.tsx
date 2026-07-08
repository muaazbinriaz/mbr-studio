"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

import { testimonials } from "@/data/testimonials";
import type { Testimonial } from "@/types";

/**
 * Testimonials — Prompt 12 (part 1 of 2)
 *
 * Blueprint ref: Part 1, Section 7 (Home Page section order:
 * ... → Technologies → Testimonials → FAQ → ...)
 *
 * Real shape (from types.ts) — note there's no `id` field, so list keys
 * and the carousel's AnimatePresence key below use array index instead:
 *
 *   export interface Testimonial {
 *     quote: string;
 *     author: string;
 *     role: string;
 *     company: string;
 *     avatar?: string;
 *   }
 *
 * GLASSMORPHISM: used deliberately here (semi-transparent card +
 * backdrop-blur over the ambient background) — this is the one section
 * on the page where the design system's "glass only where it serves a
 * clear hierarchy purpose" clause applies, since a floating quote card
 * over a soft background is the whole point of a testimonial module.
 *
 * EMPTY STATE: if data/testimonials.ts has no entries, no carousel
 * chrome (arrows, dots) renders — just a quiet placeholder card, so
 * nothing looks broken before real testimonials are collected.
 */

export function Testimonials() {
  const list = testimonials as Testimonial[];

  if (list.length === 0) {
    return (
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            What clients say
          </p>
          <div className="rounded-2xl border border-border bg-card/60 px-8 py-14 backdrop-blur-md">
            <Quote className="mx-auto mb-4 h-6 w-6 text-secondary-text" />
            <p className="font-heading text-xl font-medium text-text">
              Client stories are on their way.
            </p>
            <p className="mt-2 font-body text-sm text-secondary-text">
              We&apos;re gathering feedback from recent projects — check back
              soon.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return <TestimonialCarousel testimonials={list} />;
}

function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex((next + testimonials.length) % testimonials.length);
  };

  const current = testimonials[index];

  return (
    <section className="border-t border-border bg-secondary-background">
      <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
        <p className="mb-10 text-center font-body text-sm font-medium tracking-wide text-accent">
          What clients say
        </p>

        <div className="relative">
          <div
            className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md"
            aria-live="polite"
          >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={index}
                custom={direction}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction >= 0 ? 40 : -40 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction >= 0 ? -40 : 40 }
                }
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="px-8 py-14 text-center sm:px-14"
              >
                <Quote className="mx-auto mb-6 h-6 w-6 text-primary" />
                <p className="font-heading text-xl font-medium leading-relaxed text-text sm:text-2xl">
                  &ldquo;{current.quote}&rdquo;
                </p>

                <div className="mt-8 flex items-center justify-center gap-3">
                  {current.avatar ? (
                    <Image
                      src={current.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-heading text-sm font-semibold text-primary-foreground">
                      {current.author.charAt(0)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-body text-sm font-semibold text-text">
                      {current.author}
                    </p>
                    <p className="font-body text-xs text-secondary-text">
                      {current.role}
                      {current.company ? ` · ${current.company}` : ""}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {testimonials.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous testimonial"
                className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 rounded-full border border-border bg-card p-2 text-text transition-colors duration-200 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-translate-x-14"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next testimonial"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full border border-border bg-card p-2 text-text transition-colors duration-200 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:translate-x-14"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="mt-8 flex items-center justify-center gap-2">
                {testimonials.map((t, i) => (
                  <button
                    key={`${t.author}-${i}`}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to testimonial ${i + 1} of ${testimonials.length}`}
                    aria-current={i === index}
                    className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      i === index
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-border hover:bg-secondary-text"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
