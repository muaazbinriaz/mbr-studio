"use client";
import { useEffect } from "react";
import { useChatPanel } from "@/components/chatbot/useChat";

/**
 * Hides the site's native floating chat launcher while mounted.
 * Used on /ai-agent, which injects its own demo widget script —
 * without this, two floating chat bubbles stack bottom-right.
 */
export function SuppressLauncherOnMount() {
  const { setLauncherSuppressed } = useChatPanel();

  useEffect(() => {
    setLauncherSuppressed(true);
    return () => setLauncherSuppressed(false);
  }, [setLauncherSuppressed]);

  return null;
}
