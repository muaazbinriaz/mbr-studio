"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Send, Sparkles, AlertTriangle, MessageCircle } from "lucide-react";

import { useChatPanel } from "@/components/chatbot/useChat";
import { useAIChat } from "@/hooks/useChat";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { OpeningOptions } from "./OpeningOptions";
import { OPENING_OPTIONS } from "./chatbot";
import { buildWhatsAppLink } from "@/config/contact";
import { cn } from "@/lib/utils";

// Spring used for the panel opening on desktop — mirrors the "pop up from
// the launcher" feel used by Intercom/Crisp. Closing reuses a quicker tween
// (see panelVariants.hidden.transition below) since exits should feel snappy,
// not bouncy.
const OPEN_SPRING = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
} as const;
const CLOSE_TWEEN = { duration: 0.16, ease: "easeIn" } as const;

const panelVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96, transition: CLOSE_TWEEN },
  visible: { opacity: 1, y: 0, scale: 1, transition: OPEN_SPRING },
};

const iconVariants = {
  initial: { opacity: 0, rotate: -90, scale: 0.5 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 90, scale: 0.5 },
};

export function ChatWindow() {
  const { isOpen, close, toggle } = useChatPanel();
  const { messages, sendMessage, status, error, regenerate } = useAIChat();
  const shouldReduceMotion = useReducedMotion();

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  // Tracks whether an assistant reply has arrived while the panel was
  // closed, so the launcher can show an unread cue instead of the bot
  // silently answering into a closed panel.
  const seenCountRef = useRef(0);
  const [hasUnread, setHasUnread] = useState(false);

  useFocusTrap(panelRef, isOpen, close);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    if (isOpen) {
      seenCountRef.current = messages.length;
      setHasUnread(false);
    } else if (messages.length > seenCountRef.current) {
      setHasUnread(true);
    }
  }, [messages.length, isOpen]);

  const lastMessage = messages[messages.length - 1];
  const lastMessageHasVisibleContent =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some(
      (p) => p.type === "text" && (p as { text?: string }).text?.trim(),
    );

  const isWaiting =
    status === "submitted" ||
    (status === "streaming" && !lastMessageHasVisibleContent);
  const isBusy = status === "submitted" || status === "streaming";
  const hasStarted = messages.length > 0;

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setDraft("");
  };

  const handleOptionSelect = (label: string) => {
    if (isBusy) return;
    sendMessage({ text: label });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            id="mbr-chat-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="MBR Studio AI Assistant"
            variants={shouldReduceMotion ? undefined : panelVariants}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate={shouldReduceMotion ? undefined : "visible"}
            exit={shouldReduceMotion ? undefined : "hidden"}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden rounded-none border-border bg-card pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/40 sm:inset-auto sm:bottom-28 sm:right-6 sm:h-[min(680px,calc(100vh-120px))] sm:w-[min(420px,calc(100vw-32px))] sm:rounded-2xl sm:border sm:pt-0 sm:pb-0"
          >
            {/* Mobile-only drag handle — visual affordance that this is a
                bottom sheet. Not wired to a swipe gesture; the X below and
                the launcher button (top-of-thumb / bottom-right) both close
                it, which is enough reachable-by-thumb coverage without
                pulling in a gesture library. */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    MBR Studio Assistant
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Usually replies instantly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div
              ref={scrollRef}
              aria-live="polite"
              aria-atomic="false"
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              <div className="flex flex-col gap-2.5">
                {!hasStarted && (
                  <div className="flex items-end gap-2">
                    <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 font-body text-sm leading-relaxed text-foreground">
                      Hi, I&apos;m the MBR Studio assistant. I can help point
                      you to a quote, a consultation, or examples of our work —
                      what would you like to do?
                    </div>
                  </div>
                )}

                {messages.map((message, i) => {
                  const prevRole = messages[i - 1]?.role;
                  const showAvatar = prevRole !== message.role;
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      showAvatar={showAvatar}
                    />
                  );
                })}

                {isWaiting && (
                  <div className="flex items-end gap-2">
                    <div className="w-7 flex-none">
                      {messages[messages.length - 1]?.role !== "assistant" && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
                          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                        </div>
                      )}
                    </div>
                    <TypingIndicator />
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="ml-9 flex flex-col gap-2 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 font-body text-sm text-error"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 flex-none"
                        strokeWidth={1.75}
                      />
                      <span>
                        Something went wrong reaching the assistant. You can try
                        again, or reach the team directly.
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => regenerate()}
                        className="rounded-lg border border-error/40 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
                      >
                        Try again
                      </button>

                      <a
                        href={buildWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-error/40 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
                      >
                        Message us on WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!hasStarted && !isBusy && (
              <OpeningOptions
                options={OPENING_OPTIONS}
                onSelect={(option) => handleOptionSelect(option.label)}
              />
            )}

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                aria-label="Message"
                disabled={isBusy}
                className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isBusy}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close chat" : "Open chat with MBR Studio"}
        aria-expanded={isOpen}
        aria-controls="mbr-chat-panel"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
        animate={
          !shouldReduceMotion && !isOpen
            ? { scale: [1, 1.05, 1] }
            : { scale: 1 }
        }
        transition={
          !shouldReduceMotion && !isOpen
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.15 }
        }
        className={cn(
          // BUGFIX: on mobile the chat panel renders full-screen
          // (`fixed inset-0`, see panel className above) at the same
          // z-index (z-50) as this button. Since this button always
          // rendered afterward in the DOM, it visually floated on top
          // of the panel's own bottom-right corner — directly over the
          // message input's Send button — showing a second, redundant,
          // misplaced X once the panel was open. Hidden below `sm` while
          // open; the panel's own header X is the only close affordance
          // there. Kept visible on `sm`+ where the panel is a bottom-right
          // floating card that doesn't cover this screen area, so the
          // button coexisting below it (Intercom-style) still works.
          "fixed z-50 h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-black/30 sm:flex sm:bottom-6 sm:right-6",
          isOpen ? "hidden" : "flex bottom-4 right-4",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? "close" : "chat"}
            variants={shouldReduceMotion ? undefined : iconVariants}
            initial={shouldReduceMotion ? undefined : "initial"}
            animate={shouldReduceMotion ? undefined : "animate"}
            exit={shouldReduceMotion ? undefined : "exit"}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex"
          >
            {isOpen ? (
              <X className="h-6 w-6" strokeWidth={1.75} />
            ) : (
              <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
            )}
          </motion.span>
        </AnimatePresence>

        {hasUnread && !isOpen && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-error"
            aria-hidden="true"
          />
        )}
      </motion.button>
    </>
  );
}
