"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, PartyPopper, ArrowRight } from "lucide-react";
import { markEmbedAdded } from "@/app/(platform-client)/dashboard/onboarding/actions";

export interface ChecklistItem {
  key: string;
  label: string;
  href: string;
  done: boolean;
  selfReported?: boolean;
  /** Short one-line "why this matters" — optional, shown under the label. */
  hint?: string;
  /** One emoji shown in the step's numbered circle once it's not done. */
  emoji?: string;
}

const DISMISS_KEY = "gettingStartedDismissed";

export function GettingStartedChecklist({ items }: { items: ChecklistItem[] }) {
  const required = items.filter((i) => !i.key.startsWith("optional_"));
  const completedRequired = required.filter((i) => i.done).length;
  const allRequiredDone = completedRequired === required.length;

  const [dismissed, setDismissed] = useState(true); // avoid flash before we read localStorage
  const [isPending, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (allRequiredDone && dismissed) return null;

  if (allRequiredDone) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mb-8 flex items-center justify-between rounded-2xl border border-success/30 bg-success/[0.06] px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20,
              delay: 0.1,
            }}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-success/15 text-success"
          >
            <PartyPopper className="h-4 w-4" strokeWidth={1.75} />
          </motion.div>
          <div>
            <p className="font-body text-sm font-semibold text-foreground">
              🎉 You&apos;re all set up!
            </p>
            <p className="font-body text-xs text-secondary-text">
              Your agent is live and ready to chat with visitors.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "true");
            setDismissed(true);
          }}
          className="flex-none rounded font-body text-xs text-secondary-text underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Dismiss
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-primary/[0.04] px-6 py-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">
            🚀 Getting started
          </h2>
          <p className="mt-0.5 font-body text-xs text-secondary-text">
            {required.length - completedRequired === 1
              ? "One more step and your agent is fully live."
              : `${required.length - completedRequired} steps left to go fully live.`}
          </p>
        </div>
        <span className="flex-none rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary">
          {completedRequired} / {required.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(completedRequired / required.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary to-accent"
        />
      </div>

      {/* Steps */}
      <div className="flex flex-col divide-y divide-border px-6">
        {items.map((item, i) => (
          <div key={item.key} className="flex items-center gap-4 py-4">
            {/* Numbered / checked circle */}
            <AnimatePresence mode="wait" initial={false}>
              {item.done ? (
                <motion.div
                  key="done"
                  initial={
                    shouldReduceMotion ? false : { scale: 0.4, opacity: 0 }
                  }
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 border-dashed border-border font-body text-sm"
                >
                  {item.emoji ?? i + 1}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Label + hint */}
            <div className="min-w-0 flex-1">
              <p
                className={`font-body text-sm font-medium ${
                  item.done
                    ? "text-secondary-text line-through"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </p>
              {item.hint && !item.done && (
                <p className="mt-0.5 font-body text-xs text-secondary-text">
                  {item.hint}
                </p>
              )}
              {item.selfReported && !item.done && (
                <p className="mt-0.5 font-body text-xs text-secondary-text/70 italic">
                  Mark this yourself once it&apos;s live on your site
                </p>
              )}
            </div>

            {/* Action */}
            {item.selfReported && !item.done ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await markEmbedAdded();
                  })
                }
                className="flex-none rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 font-body text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Mark as done
              </button>
            ) : (
              !item.done && (
                <Link
                  href={item.href}
                  className="flex flex-none items-center gap-1 rounded-lg px-3 py-1.5 font-body text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Go
                  <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </Link>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
