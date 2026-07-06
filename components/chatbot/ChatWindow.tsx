"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Send, Sparkles, AlertTriangle, MessageCircle } from "lucide-react";

import { useChatPanel } from "@/components/chatbot/useChat";
import { useAIChat } from "@/hooks/useChat";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { OpeningOptions } from "./OpeningOptions";
import { OPENING_OPTIONS } from "./chatbot";
import { buildWhatsAppLink } from "@/config/contact";

export function ChatWindow() {
  const { isOpen, open, close } = useChatPanel();
  const { messages, sendMessage, status, error, regenerate } = useAIChat();

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useFocusTrap(panelRef, isOpen, close);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  // Panel band hai -> persistent floating launcher bubble render karo.
  // Yehi missing tha poore project mein.
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Open chat with MBR Studio"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-black/30 transition-transform duration-200 hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
      </button>
    );
  }

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
    <div
      id="mbr-chat-panel"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="MBR Studio AI Assistant"
      className="fixed bottom-24 right-4 z-50 flex h-[min(680px,calc(100vh-120px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 sm:bottom-28 sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
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
                Hi, I&apos;m the MBR Studio assistant. I can help point you to a
                quote, a consultation, or examples of our work — what would you
                like to do?
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
    </div>
  );
}
