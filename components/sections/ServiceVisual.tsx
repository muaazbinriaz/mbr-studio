// components/sections/ServiceVisual.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bot, Check, MessageCircle, Sparkles } from "lucide-react";

/**
 * Per-service product mockup for the /services page.
 *
 * v2 fixes + additions:
 *
 * 1) EMPTY BOXES BUG: entrance animation used to be `whileInView`
 *    (scroll-triggered). Any tool/browser that renders the full page
 *    height at once without an actual scroll event (full-page
 *    screenshot capture, some prerenderers, etc.) never fires that
 *    IntersectionObserver, so every section after the first one stayed
 *    at its `initial={opacity:0}` state — i.e. invisible. Switched to a
 *    plain mount `animate` so every visual is guaranteed visible
 *    regardless of scroll/capture behavior.
 *
 * 2) LOOPING TYPED CONVERSATIONS: the two chat-style mockups
 *    (ai-business-automation, whatsapp-automation) now use the same
 *    word-by-word-typing + hold + reset loop as HeroVisual.tsx, via the
 *    local `useConversationLoop` hook below. A fixed-height message zone
 *    (same technique as HeroVisual) keeps the card frame from resizing
 *    as bubbles appear.
 *
 * 3) The other four (non-chat) mockups get a lighter continuous "alive"
 *    animation appropriate to what they represent, instead of a static
 *    render — subtle, on a slow loop, and skipped under
 *    prefers-reduced-motion.
 *
 * Purely decorative (aria-hidden); the real "What's included" list next
 * to each one still carries the actual information.
 */

// ---------------------------------------------------------------------
// Shared: letter-by-letter typed conversation loop (chat-style mockups)
//
// v3 fixes:
// - Types character-by-character instead of word-by-word for a smoother,
//   more natural typing feel (was jumping in whole-word chunks before).
// - Returns `currentFull` (the complete text of the message currently
//   being typed) so the bubble can reserve its final width/height up
//   front — see the "ghost sizing" comment where this is consumed.
//   Without this, an `ml-auto` bubble whose width grows as text is
//   typed keeps its *right* edge fixed and its *left* edge moving,
//   which reads as the text growing right-to-left instead of typing
//   left-to-right.
// ---------------------------------------------------------------------
function useConversationLoop(messages: string[], shouldReduceMotion: boolean) {
  const lastMessageLength = messages[messages.length - 1]?.length ?? 0;
  const [index, setIndex] = useState(
    shouldReduceMotion ? messages.length - 1 : 0,
  );
  const [charCount, setCharCount] = useState(
    shouldReduceMotion ? lastMessageLength : 0,
  );
  const [showBadge, setShowBadge] = useState(shouldReduceMotion);

  useEffect(() => {
    if (shouldReduceMotion) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function typeMessage(i: number, count: number) {
      if (cancelled) return;
      const text = messages[i];

      if (count >= text.length) {
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          if (i + 1 < messages.length) {
            setIndex(i + 1);
            setCharCount(0);
            typeMessage(i + 1, 0);
          } else {
            setShowBadge(true);
            timeoutId = setTimeout(() => {
              if (cancelled) return;
              setShowBadge(false);
              setIndex(0);
              setCharCount(0);
              typeMessage(0, 0);
            }, 2200);
          }
        }, 500);
        return;
      }

      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setCharCount(count + 1);
        typeMessage(i, count + 1);
      }, 28); // per-character interval — smooth typewriter feel
    }

    typeMessage(0, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion]);

  const revealed = messages.slice(0, index);
  const currentFull = messages[index] ?? "";
  const currentPartial = currentFull.slice(0, charCount);
  const isTypingCurrent = !shouldReduceMotion && charCount < currentFull.length;

  return {
    revealed,
    currentFull,
    currentPartial,
    currentIndex: index,
    isTypingCurrent,
    showBadge,
  };
}

const mountFadeIn = (shouldReduceMotion: boolean | null) =>
  shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

// ---------------------------------------------------------------------
// digital-product-development
// ---------------------------------------------------------------------
function DigitalProductVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      {...mountFadeIn(shouldReduceMotion)}
      aria-hidden="true"
      className="mockup-card gradient-ring w-full max-w-sm overflow-hidden rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-3 flex-1 truncate rounded-md mockup-fill px-2.5 py-1 text-[11px] text-secondary-text">
          yourbusiness.com
        </span>
      </div>
      <div className="space-y-3 p-5">
        <motion.div
          className="h-3 w-2/3 rounded bg-gradient-to-r from-primary to-accent opacity-80"
          animate={shouldReduceMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="h-2 w-full rounded mockup-fill" />
        <div className="h-2 w-5/6 rounded mockup-fill" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-14 rounded-lg mockup-fill"
              animate={
                shouldReduceMotion ? undefined : { opacity: [0.5, 1, 0.5] }
              }
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
        <motion.div
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-3 w-3" /> Core Web Vitals: 98
        </motion.div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// ai-business-automation (looping typed conversation)
// ---------------------------------------------------------------------
const AI_MESSAGES = [
  "Do you offer refunds after 30 days?",
  "Our policy covers returns within 30 days — I can start that for you now.",
];

function AiAutomationVisual() {
  const shouldReduceMotion = useReducedMotion();
  const {
    revealed,
    currentFull,
    currentPartial,
    currentIndex,
    isTypingCurrent,
    showBadge,
  } = useConversationLoop(AI_MESSAGES, !!shouldReduceMotion);

  return (
    <motion.div
      {...mountFadeIn(shouldReduceMotion)}
      aria-hidden="true"
      className="mockup-card gradient-ring flex w-full max-w-sm flex-col gap-3 rounded-xl p-5 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Support Agent</p>
          <p className="text-xs text-secondary-text">Trained on your docs</p>
        </div>
      </div>

      {/* Reserved zone — height is set by the invisible "ghost" copy of the
          full conversation below, so it is exactly tall enough for every
          phase of the loop (mid-type, all messages, or the badge) and
          never resizes the card frame around it. */}
      <div className="relative min-h-[104px]">
        {/* Ghost: the complete, final conversation + badge, rendered
            invisibly. It is never removed, so this zone's height is
            constant for the entire lifetime of the component. */}
        <div aria-hidden="true" className="invisible flex flex-col gap-2">
          {AI_MESSAGES.map((text, i) => (
            <div
              key={i}
              className={
                i % 2 === 0
                  ? "w-fit rounded-lg px-3 py-2 text-xs"
                  : "ml-auto w-fit max-w-[85%] rounded-lg px-3 py-2 text-xs"
              }
            >
              {text}
            </div>
          ))}
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Check className="h-3 w-3" /> Resolved without a human
          </div>
        </div>

        {/* Real animated content, stacked exactly over the ghost above. */}
        <div className="absolute inset-0 flex flex-col justify-start gap-2">
          {revealed.map((text, i) => (
            <div
              key={i}
              className={
                i % 2 === 0
                  ? "w-fit rounded-lg mockup-fill px-3 py-2 text-xs text-secondary-text"
                  : "ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
              }
            >
              {text}
            </div>
          ))}

          {currentIndex < AI_MESSAGES.length && (
            <div
              className={
                currentIndex % 2 === 0
                  ? "relative w-fit rounded-lg mockup-fill px-3 py-2 text-xs text-secondary-text"
                  : "relative ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
              }
            >
              {/* Invisible full text reserves this bubble's final size
                  immediately, so it never grows leftward as characters
                  are typed in — this is what fixes the right-to-left
                  look on the ml-auto (reply) bubble. */}
              <span className="invisible whitespace-pre-wrap">
                {shouldReduceMotion ? AI_MESSAGES[currentIndex] : currentFull}
              </span>
              <span className="absolute inset-0 px-3 py-2">
                {shouldReduceMotion
                  ? AI_MESSAGES[currentIndex]
                  : currentPartial}
                {isTypingCurrent && (
                  <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-current align-middle" />
                )}
              </span>
            </div>
          )}

          {showBadge && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success"
            >
              <Check className="h-3 w-3" /> Resolved without a human
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// whatsapp-automation (looping typed conversation)
// ---------------------------------------------------------------------
const WHATSAPP_MESSAGES = [
  "Hi! I'd like to book a table for 4 on Friday",
  "Got it — Friday, 4 guests. 7:00 PM or 8:30 PM?",
  "7:00 works",
];

function WhatsAppVisual() {
  const shouldReduceMotion = useReducedMotion();
  const {
    revealed,
    currentFull,
    currentPartial,
    currentIndex,
    isTypingCurrent,
    showBadge,
  } = useConversationLoop(WHATSAPP_MESSAGES, !!shouldReduceMotion);

  return (
    <motion.div
      {...mountFadeIn(shouldReduceMotion)}
      aria-hidden="true"
      className="mockup-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Booking Assistant
          </p>
          <p className="text-xs text-secondary-text">via WhatsApp</p>
        </div>
      </div>

      {/* Reserved zone — height is set by the invisible "ghost" copy of the
          full conversation below, so it is exactly tall enough for every
          phase of the loop and never resizes the card frame around it. */}
      <div className="relative min-h-[132px]">
        {/* Ghost: the complete, final conversation + badge, rendered
            invisibly. It is never removed, so this zone's height is
            constant for the entire lifetime of the component. */}
        <div aria-hidden="true" className="invisible flex flex-col gap-2">
          {WHATSAPP_MESSAGES.map((text, i) => (
            <div
              key={i}
              className={
                i % 2 === 0
                  ? "w-fit max-w-[85%] rounded-lg rounded-tl-none px-3 py-2 text-xs"
                  : "ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none px-3 py-2 text-xs"
              }
            >
              {text}
            </div>
          ))}
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Check className="h-3 w-3" /> Booking confirmed · 0 staff time
          </div>
        </div>

        {/* Real animated content, stacked exactly over the ghost above. */}
        <div className="absolute inset-0 flex flex-col justify-start gap-2">
          {revealed.map((text, i) => (
            <div
              key={i}
              className={
                i % 2 === 0
                  ? "w-fit max-w-[85%] rounded-lg rounded-tl-none mockup-fill px-3 py-2 text-xs text-secondary-text"
                  : "ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-primary px-3 py-2 text-xs text-primary-foreground"
              }
            >
              {text}
            </div>
          ))}

          {currentIndex < WHATSAPP_MESSAGES.length && (
            <div
              className={
                currentIndex % 2 === 0
                  ? "relative w-fit max-w-[85%] rounded-lg rounded-tl-none mockup-fill px-3 py-2 text-xs text-secondary-text"
                  : "relative ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-primary px-3 py-2 text-xs text-primary-foreground"
              }
            >
              {/* Invisible full text reserves this bubble's final size
                  immediately, so it never grows leftward as characters
                  are typed in — this is what fixes the right-to-left
                  look on the ml-auto (reply) bubbles. */}
              <span className="invisible whitespace-pre-wrap">
                {shouldReduceMotion
                  ? WHATSAPP_MESSAGES[currentIndex]
                  : currentFull}
              </span>
              <span className="absolute inset-0 px-3 py-2">
                {shouldReduceMotion
                  ? WHATSAPP_MESSAGES[currentIndex]
                  : currentPartial}
                {isTypingCurrent && (
                  <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-current align-middle" />
                )}
              </span>
            </div>
          )}

          {showBadge && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success"
            >
              <Check className="h-3 w-3" /> Booking confirmed · 0 staff time
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// landing-pages
// ---------------------------------------------------------------------
function LandingPagesVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      {...mountFadeIn(shouldReduceMotion)}
      aria-hidden="true"
      className="mockup-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
    >
      <div className="mx-auto flex w-40 flex-col items-center gap-2 rounded-2xl border border-border mockup-fill p-3">
        <div className="h-2 w-16 rounded bg-gradient-to-r from-primary to-accent" />
        <div className="h-1.5 w-24 rounded bg-border" />
        <div className="h-1.5 w-20 rounded bg-border" />
        <motion.div
          className="mt-2 h-6 w-24 rounded-md bg-primary"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg mockup-fill px-3 py-2">
        <span className="text-[11px] text-secondary-text">Conversion rate</span>
        <motion.span
          className="flex items-center gap-1 text-xs font-semibold text-success"
          animate={shouldReduceMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-3 w-3" /> +38%
        </motion.span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// saas-development
// ---------------------------------------------------------------------
const BAR_HEIGHTS_A = [40, 65, 45, 80, 60, 95, 70];
const BAR_HEIGHTS_B = [55, 50, 70, 60, 85, 75, 90];

function SaasDevelopmentVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      {...mountFadeIn(shouldReduceMotion)}
      aria-hidden="true"
      className="mockup-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
    >
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg mockup-fill p-2">
          <p className="text-[10px] text-secondary-text">MRR</p>
          <p className="text-sm font-semibold text-foreground">$12.4k</p>
        </div>
        <div className="rounded-lg mockup-fill p-2">
          <p className="text-[10px] text-secondary-text">Users</p>
          <p className="text-sm font-semibold text-foreground">2,180</p>
        </div>
        <div className="rounded-lg mockup-fill p-2">
          <p className="text-[10px] text-secondary-text">Uptime</p>
          <p className="text-sm font-semibold text-foreground">99.9%</p>
        </div>
      </div>
      <div className="flex h-16 items-end gap-1.5 rounded-lg mockup-fill p-2">
        {BAR_HEIGHTS_A.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-primary to-accent opacity-80"
            initial={{ height: `${h}%` }}
            animate={
              shouldReduceMotion
                ? undefined
                : { height: [`${h}%`, `${BAR_HEIGHTS_B[i]}%`, `${h}%`] }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// ui-ux-design
// ---------------------------------------------------------------------
function UiUxDesignVisual() {
  const shouldReduceMotion = useReducedMotion();
  const swatches = ["bg-primary", "bg-accent", "bg-success", ""];

  return (
    <motion.div
      {...mountFadeIn(shouldReduceMotion)}
      aria-hidden="true"
      className="mockup-card gradient-ring w-full max-w-sm rounded-xl p-5 shadow-lg"
    >
      <div className="mb-4 flex items-center gap-2">
        {swatches.map((cls, i) => (
          <motion.span
            key={i}
            className={`h-6 w-6 rounded-full ${
              cls || "border border-border mockup-fill"
            }`}
            animate={shouldReduceMotion ? undefined : { scale: [1, 1.15, 1] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.25,
            }}
          />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-8 w-full rounded-md border border-border mockup-fill px-3" />
        <div className="flex gap-2">
          <motion.div
            className="h-7 w-16 rounded-md bg-primary"
            animate={
              shouldReduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="h-7 w-16 rounded-md border border-border bg-transparent" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------
export function ServiceVisual({ slug }: { slug: string }) {
  switch (slug) {
    case "digital-product-development":
      return <DigitalProductVisual />;
    case "ai-business-automation":
      return <AiAutomationVisual />;
    case "whatsapp-automation":
      return <WhatsAppVisual />;
    case "landing-pages":
      return <LandingPagesVisual />;
    case "saas-development":
      return <SaasDevelopmentVisual />;
    case "ui-ux-design":
      return <UiUxDesignVisual />;
    default:
      return null;
  }
}
