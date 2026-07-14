// components/sections/HeroVisual.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

/**
 * Step 1 redesign: new hero visual, hidden below `lg`.
 *
 * v2 FIX: previously the card's height grew every time the reply bubble
 * / "Typing…" indicator mounted (they weren't in the layout until
 * `typingDone`), which pushed the whole bordered card taller mid-cycle —
 * that's the "poora box agay peechay ho raha" bug. Fixed by giving the
 * message area a fixed `min-h` that already reserves room for all three
 * lines (assistant bubble + reply + typing indicator), so the outer
 * `animated-border` card frame never resizes — only the content inside
 * it changes.
 *
 * v2 ALSO ADDS: a full looping conversation cycle instead of a one-shot
 * animation — word-by-word typing → reply bubble → "Typing…" → hold →
 * fade out → retype, forever. Respects prefers-reduced-motion by
 * freezing on the finished state with no loop.
 */

const BUBBLE_TEXT = "Hey! Want to see what we can automate for your business?";
const REPLY_TEXT = "Yes — show me a demo";
const INDICATOR_TEXT = "Typing…";
const CHAR_INTERVAL = 22; // ms per character — smooth letter-by-letter typewriter feel
const HOLD_AFTER_REPLY = 2200; // ms the finished conversation stays visible
const PAUSE_BEFORE_RETYPE = 700; // ms blank pause before the loop restarts

type Phase = "typing" | "replyTyping" | "indicatorTyping" | "hold" | "reset";

export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion();
  const [charCount, setCharCount] = useState(
    shouldReduceMotion ? BUBBLE_TEXT.length : 0,
  );
  const [replyCharCount, setReplyCharCount] = useState(
    shouldReduceMotion ? REPLY_TEXT.length : 0,
  );
  const [indicatorCharCount, setIndicatorCharCount] = useState(
    shouldReduceMotion ? INDICATOR_TEXT.length : 0,
  );
  const [phase, setPhase] = useState<Phase>(
    shouldReduceMotion ? "hold" : "typing",
  );

  // Letter-by-letter reveal — assistant bubble
  useEffect(() => {
    if (shouldReduceMotion || phase !== "typing") return;
    if (charCount >= BUBBLE_TEXT.length) {
      setPhase("replyTyping");
      return;
    }
    const t = setTimeout(() => setCharCount((c) => c + 1), CHAR_INTERVAL);
    return () => clearTimeout(t);
  }, [charCount, phase, shouldReduceMotion]);

  // Letter-by-letter reveal — reply bubble
  useEffect(() => {
    if (shouldReduceMotion || phase !== "replyTyping") return;
    if (replyCharCount >= REPLY_TEXT.length) {
      setPhase("indicatorTyping");
      return;
    }
    const t = setTimeout(() => setReplyCharCount((c) => c + 1), CHAR_INTERVAL);
    return () => clearTimeout(t);
  }, [replyCharCount, phase, shouldReduceMotion]);

  // Letter-by-letter reveal — "Typing…" indicator
  useEffect(() => {
    if (shouldReduceMotion || phase !== "indicatorTyping") return;
    if (indicatorCharCount >= INDICATOR_TEXT.length) {
      setPhase("hold");
      return;
    }
    const t = setTimeout(
      () => setIndicatorCharCount((c) => c + 1),
      CHAR_INTERVAL,
    );
    return () => clearTimeout(t);
  }, [indicatorCharCount, phase, shouldReduceMotion]);

  // Conversation loop: hold -> reset -> typing again
  useEffect(() => {
    if (shouldReduceMotion) return;
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("reset"), HOLD_AFTER_REPLY);
      return () => clearTimeout(t);
    }
    if (phase === "reset") {
      const t = setTimeout(() => {
        setCharCount(0);
        setReplyCharCount(0);
        setIndicatorCharCount(0);
        setPhase("typing");
      }, PAUSE_BEFORE_RETYPE);
      return () => clearTimeout(t);
    }
  }, [phase, shouldReduceMotion]);

  const showAssistantBubble = phase !== "reset";
  const showReply =
    phase === "replyTyping" || phase === "indicatorTyping" || phase === "hold";
  const showTypingIndicator = phase === "indicatorTyping" || phase === "hold";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      aria-hidden="true"
      className="animated-border glass-card hidden w-[320px] shrink-0 flex-col gap-3 rounded-xl p-5 shadow-lg lg:flex"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">MBR Assistant</p>
          <p className="text-xs text-secondary-text">Online now</p>
        </div>
      </div>

      {/* Fixed-height reserved zone — room for all 3 rows at once so the
          card frame above never resizes as the conversation plays out. */}
      <div className="flex min-h-[144px] flex-col justify-start gap-3">
        <AnimatePresence>
          {showAssistantBubble && (
            <motion.div
              key="assistant-bubble"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text"
            >
              {BUBBLE_TEXT.slice(0, charCount)}
              {phase === "typing" && (
                <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-secondary-text align-middle" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReply && (
            <motion.div
              key="reply-bubble"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
            >
              {/* Invisible full text reserves the bubble's final width up
                  front, so ml-auto locks its right edge immediately and the
                  box never grows from the right (that was causing the
                  right-to-left illusion). The visible text overlays on top
                  and always fills in left-to-right. */}
              <span className="invisible whitespace-pre-wrap">
                {REPLY_TEXT}
              </span>
              <span className="absolute inset-0 whitespace-pre-wrap px-3 py-2">
                {REPLY_TEXT.slice(0, replyCharCount)}
                {phase === "replyTyping" && (
                  <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-primary-foreground align-middle" />
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTypingIndicator && (
            <motion.div
              key="typing-indicator"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              {INDICATOR_TEXT.slice(0, indicatorCharCount)}
              {phase === "indicatorTyping" && (
                <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-secondary-text align-middle" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// // components/sections/HeroVisual.tsx
// "use client";

// import { motion, useReducedMotion } from "framer-motion";
// import { Bot, Sparkles } from "lucide-react";

// /**
//  * Step 1 redesign: new hero visual, hidden below `lg`.
//  *
//  * The eyebrow copy already says "try it live below" — this gives visitors
//  * a preview of what that AI agent actually looks like before they scroll,
//  * instead of the hero being text-only. Pure CSS/SVG, no image assets, so
//  * it costs nothing extra to load. Uses the new `.glass-card` /
//  * `.animated-border` utilities added to globals.css — see that diff.
//  *
//  * This is a static, non-interactive preview (aria-hidden) — it is NOT a
//  * duplicate chat widget. The real widget (ChatWindow.tsx) still owns all
//  * actual chat functionality.
//  */
// export function HeroVisual() {
//   const shouldReduceMotion = useReducedMotion();

//   return (
//     <motion.div
//       initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
//       animate={{ opacity: 1, y: 0, scale: 1 }}
//       transition={{ duration: 0.6, delay: 0.3 }}
//       aria-hidden="true"
//       className="animated-border glass-card hidden w-[320px] shrink-0 flex-col gap-3 rounded-xl p-5 shadow-lg lg:flex"
//     >
//       <div className="flex items-center gap-2">
//         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
//           <Bot className="h-4 w-4" />
//         </div>
//         <div>
//           <p className="text-sm font-semibold text-foreground">MBR Assistant</p>
//           <p className="text-xs text-secondary-text">Online now</p>
//         </div>
//       </div>

//       <div className="rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text">
//         Hey! Want to see what we can automate for your business?
//       </div>
//       <div className="ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
//         Yes — show me a demo
//       </div>
//       <div className="flex items-center gap-1.5 rounded-lg bg-secondary-background px-3 py-2 text-xs text-secondary-text">
//         <Sparkles className="h-3 w-3 text-accent" />
//         Typing…
//       </div>
//     </motion.div>
//   );
// }
