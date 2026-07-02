import type { ChatMessage } from "@/components/chatbot/useChat";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed",
          isUser
            ? "bg-primary text-text"
            : "border border-border bg-card text-text",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}
