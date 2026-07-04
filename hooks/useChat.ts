"use client";

import { useChat as useAiChatSdk } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/**
 * Thin wrapper around the Vercel AI SDK's useChat, pointed at our
 * /api/chat streaming endpoint. Keeps the chatbot components decoupled
 * from the SDK's import path in case it changes.
 *
 * Renamed from `useChat` to `useAIChat` to avoid colliding with
 * `components/chatbot/useChat.tsx`'s `useChatPanel` — that file only
 * owns panel open/close state, this one owns message state/streaming.
 */
export function useAIChat() {
  return useAiChatSdk({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
}
