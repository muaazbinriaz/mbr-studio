"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  OPENING_OPTIONS,
  SERVICE_OPTIONS,
  BUDGET_OPTIONS,
  WORK_OPTIONS,
  type ChatOption,
} from "@/components/chatbot/chatbot";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type ChatStage = "opening" | "service" | "budget" | "work" | "closing";

type ChatContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: ChatMessage[];
  options: ChatOption[];
  isOpeningStage: boolean;
  isTyping: boolean;
  selectOption: (option: ChatOption) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm the MBR Studio assistant. I can help point you to a quote, a consultation, or examples of our work — what would you like to do?",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Scripted qualification flow for Prompt 18 (UI scaffold).
 *
 * To wire in real AI responses once /api/chat/route.ts exists:
 * replace the body of `pushAssistantMessage` with a fetch to /api/chat
 * (streaming via the Vercel AI SDK, per Blueprint Part 1 Section 6),
 * appending tokens to a new assistant message as they arrive instead
 * of waiting on a fixed timeout.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [stage, setStage] = useState<ChatStage>("opening");
  const [isTyping, setIsTyping] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const pushAssistantMessage = useCallback((content: string, delay = 650) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content },
        ]);
        setIsTyping(false);
        resolve();
      }, delay);
    });
  }, []);

  const selectOption = useCallback(
    (option: ChatOption) => {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: option.label },
      ]);

      if (stage === "opening") {
        if (option.id === "quote" || option.id === "consultation") {
          pushAssistantMessage(
            "Happy to help. Which service are you interested in?",
          ).then(() => setStage("service"));
        } else if (option.id === "services") {
          pushAssistantMessage(
            "We offer digital product development, AI automation, WhatsApp automation, landing pages, SaaS development, dashboards, UI/UX, API integration, SEO, and maintenance. Want a quote for one of these?",
          ).then(() => setStage("service"));
        } else if (option.id === "work") {
          pushAssistantMessage(
            "Here's where you can see what we've built.",
          ).then(() => setStage("work"));
        } else {
          pushAssistantMessage(
            "Thanks for the message! For now I can help with a quote, a consultation, our services, or examples of our work — use the buttons above, or fill out the contact form for anything else.",
          );
        }
        return;
      }

      if (stage === "service") {
        pushAssistantMessage(
          "Got it. What's your rough budget for this project?",
        ).then(() => setStage("budget"));
        return;
      }

      if (stage === "budget") {
        pushAssistantMessage(
          "Thanks — that's enough for us to get started. Fill out the contact form and mention what we discussed, and the team will follow up within 1–2 business days.",
        ).then(() => setStage("closing"));
        return;
      }

      // stage === "work" or "closing": no scripted branch needed here —
      // "work" options are links (handled by SuggestionChips), and
      // "closing" shows no further options.
    },
    [stage, pushAssistantMessage],
  );

  const options = useMemo<ChatOption[]>(() => {
    switch (stage) {
      case "opening":
        return OPENING_OPTIONS;
      case "service":
        return SERVICE_OPTIONS;
      case "budget":
        return BUDGET_OPTIONS;
      case "work":
        return WORK_OPTIONS;
      default:
        return [];
    }
  }, [stage]);

  const value: ChatContextValue = {
    isOpen,
    open,
    close,
    toggle,
    messages,
    options,
    isOpeningStage: stage === "opening" && messages.length === 1,
    isTyping,
    selectOption,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
