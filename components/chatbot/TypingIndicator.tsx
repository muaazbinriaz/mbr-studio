// components/chatbot/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div
      className="flex w-fit items-center rounded-2xl border border-border bg-card px-4 py-3"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          animation: "mbr-breathe 1.6s ease-in-out infinite",
        }}
      />
    </div>
  );
}
