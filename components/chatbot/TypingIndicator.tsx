// components/chatbot/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div
      className="flex w-fit items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <span className="h-2 w-2 rounded-full bg-secondary-text animate-pulse [animation-delay:0s]" />
      <span className="h-2 w-2 rounded-full bg-secondary-text animate-pulse [animation-delay:0.2s]" />
      <span className="h-2 w-2 rounded-full bg-secondary-text animate-pulse [animation-delay:0.4s]" />
    </div>
  );
}
