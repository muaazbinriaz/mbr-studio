"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Send, Sparkles } from "lucide-react";

import { useChat } from "@/components/chatbot/useChat";
import { useFocusTrap } from "@/components/chatbot/useFocusTrap";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestionChips } from "./SuggestionChips";
import { OpeningOptions } from "./OpeningOptions";

export function ChatWindow() {
  const {
    isOpen,
    close,
    messages,
    options,
    isOpeningStage,
    isTyping,
    selectOption,
  } = useChat();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useFocusTrap(panelRef, isOpen, close);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // Free-text placeholder — once /api/chat exists, POST `text` there
    // and stream the reply instead of routing it through selectOption.
    selectOption({ id: "freeform", label: text });
    setDraft("");
  };

  return (
    <div
      id="mbr-chat-panel"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="MBR Studio AI Assistant"
      className="fixed bottom-24 right-4 z-50 flex h-[min(600px,calc(100vh-140px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 sm:bottom-28 sm:right-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-text">
              MBR Studio Assistant
            </p>
            <p className="font-body text-xs text-secondary-text">
              Usually replies instantly
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary-text transition-colors duration-200 hover:bg-card hover:text-text"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        aria-live="polite"
        aria-atomic="false"
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Staged options */}
      {!isTyping &&
        options.length > 0 &&
        (isOpeningStage ? (
          <OpeningOptions options={options} onSelect={selectOption} />
        ) : (
          <SuggestionChips
            options={options}
            onSelect={selectOption}
            onNavigate={close}
          />
        ))}

      {/* Free-text input */}
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
          className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 font-body text-sm text-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-text transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
}
