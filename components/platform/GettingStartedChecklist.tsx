"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Circle, PartyPopper } from "lucide-react";
import { markEmbedAdded } from "@/app/(platform-client)/dashboard/onboarding/actions";

export interface ChecklistItem {
  key: string;
  label: string;
  href: string;
  done: boolean;
  selfReported?: boolean;
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
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-success/15 text-success"
          >
            <PartyPopper className="h-4 w-4" strokeWidth={1.75} />
          </motion.div>
          <div>
            <p className="font-body text-sm font-semibold text-foreground">
              You&apos;re all set up!
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
          className="flex-none font-body text-xs text-secondary-text underline underline-offset-2 hover:text-foreground"
        >
          Dismiss
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Getting started
        </h2>
        <span className="font-body text-xs text-secondary-text">
          {completedRequired} of {required.length} complete
        </span>
      </div>
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${(completedRequired / required.length) * 100}%`,
          }}
        />
      </div>

      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait" initial={false}>
                {item.done ? (
                  <motion.div
                    key="done"
                    initial={
                      shouldReduceMotion ? false : { scale: 0.4, opacity: 0 }
                    }
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div key="pending">
                    <Circle className="h-4 w-4 flex-none text-secondary-text" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span
                className={`font-body text-sm ${item.done ? "text-secondary-text line-through" : "text-foreground"}`}
              >
                {item.label}
                {item.selfReported && !item.done && (
                  <span className="ml-1.5 text-xs text-secondary-text">
                    (mark as done yourself)
                  </span>
                )}
              </span>
            </div>

            {item.selfReported && !item.done ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await markEmbedAdded();
                  })
                }
                className="font-body text-xs font-medium text-primary hover:underline"
              >
                Mark as done
              </button>
            ) : (
              !item.done && (
                <Link
                  href={item.href}
                  className="font-body text-xs font-medium text-primary hover:underline"
                >
                  Go →
                </Link>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
