"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * Owns ONLY panel open/close/toggle state for the chat widget.
 *
 * Message state, sending, and streaming now live in `hooks/useChat.ts`
 * (`useAIChat`, wrapping the real AI SDK `useChat`), instantiated
 * directly inside ChatWindow.tsx. This file used to also run a
 * hardcoded stage-machine (opening → service → budget → work →
 * closing) with canned replies — that's been removed entirely now
 * that /api/chat actually powers the conversation.
 */
type ChatPanelContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  // Lets other fixed/floating UI (e.g. Navbar's mobile drawer) tell the
  // launcher button to hide itself while they're open, so two z-50
  // floating elements don't stack on top of each other.
  launcherSuppressed: boolean;
  setLauncherSuppressed: (suppressed: boolean) => void;
};

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const [launcherSuppressed, setLauncherSuppressed] = useState(false);

  const value: ChatPanelContextValue = {
    isOpen,
    open,
    close,
    toggle,
    launcherSuppressed,
    setLauncherSuppressed,
  };

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export function useChatPanel() {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) {
    throw new Error("useChatPanel must be used within a ChatProvider");
  }
  return ctx;
}
