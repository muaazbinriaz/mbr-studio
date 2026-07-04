"use client";

import { useChatPanel } from "@/components/chatbot/useChat";

export function ChatLauncherButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open } = useChatPanel();
  return (
    <button onClick={open} {...props}>
      {children}
    </button>
  );
}
