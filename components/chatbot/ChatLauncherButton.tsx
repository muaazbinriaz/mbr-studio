"use client";

import { useChat } from "@/components/chatbot/useChat";

export function ChatLauncherButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open } = useChat();
  return (
    <button onClick={open} {...props}>
      {children}
    </button>
  );
}
