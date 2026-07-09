"use client";

import dynamic from "next/dynamic";

const ChatWindow = dynamic(
  () => import("@/components/chatbot/ChatWindow").then((mod) => mod.ChatWindow),
  { ssr: false },
);

export function LazyChatWindow() {
  return <ChatWindow />;
}
