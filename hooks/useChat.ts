"use client";

import { useChat as useAiChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/**
 * Thin wrapper around the Vercel AI SDK's useChat, pointed at our
 * /api/chat streaming endpoint. Keeps the chatbot components decoupled
 * from the SDK's import path in case it changes.
 */
export function useChat() {
  return useAiChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
}
