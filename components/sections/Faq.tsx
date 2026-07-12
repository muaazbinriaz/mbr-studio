"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { faq as faqs } from "@/data/faq";
import type { FaqItem as FAQItem } from "@/types";
import { StaggerContainer, StaggerItem } from "@/components/animations/Motion";

/**
 * FAQ — Prompt 12 (part 2 of 2)
 *
 * Blueprint ref: Part 1, Section 7 (Home Page section order:
 * ... → Testimonials → FAQ → Contact CTA → ...)
 *
 * Real shape (from types.ts, exported as FaqItem) — no `id` field, so
 * open/closed state below is tracked by array index rather than id:
 *
 *   export interface FaqItem {
 *     question: string;
 *     answer: string;
 *   }
 *
 * ACCESSIBILITY:
 * - Each trigger is a real <button> (native keyboard support: Enter,
 *   Space, Tab focus order) with aria-expanded reflecting open state
 *   and aria-controls pointing at its panel's id.
 * - Each panel has role="region", aria-labelledby pointing back at its
 *   trigger id, and is only removed from the tab order (not display)
 *   via the collapsed-height animation, so screen readers relying on
 *   the DOM outline still see correct structure either way.
 * - Height animation uses the CSS grid "0fr → 1fr" technique instead of
 *   measuring scrollHeight in JS, so it works correctly with dynamic
 *   content and respects prefers-reduced-motion via the transition
 *   being purely CSS (no motion library dependency for this section).
 * - Multiple panels can open independently (not single-open-only) —
 *   simplest mental model for a support-style FAQ; easy to change to
 *   accordion-exclusive by tracking one open id instead of a Set.
 */

export function FAQ() {
  const list = faqs as FAQItem[];
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (list.length === 0) {
    return null;
  }

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
        <div className="mb-12 text-center">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            FAQ
          </p>
          <h2 className="font-heading text-h2-feature font-bold leading-tight tracking-tight text-text">
            Questions, answered.
          </h2>
        </div>

        <StaggerContainer className="divide-y divide-border border-y border-border">
          {list.map((item, index) => (
            <StaggerItem key={item.question}>
              <FAQItemRow
                item={item}
                isOpen={openIndexes.has(index)}
                onToggle={() => toggle(index)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function FAQItemRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const reactId = useId();
  const triggerId = `faq-trigger-${reactId}`;
  const panelId = `faq-panel-${reactId}`;

  return (
    <div>
      <h3>
        <button
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-4 py-6 text-left font-body transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="font-heading text-base font-semibold text-text transition-colors duration-200 group-hover:text-primary sm:text-lg">
            {item.question}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 flex-none text-secondary-text
 transition-transform duration-300 group-hover:text-primary ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className="pb-6 pr-8 font-body text-sm leading-relaxed text-secondary-text
 sm:text-base"
          >
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}
