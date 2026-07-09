"use client";

import Link from "next/link";
import type { ChatOption } from "@/components/chatbot/chatbot";

export function SuggestionChips({
  options,
  onSelect,
  onNavigate,
}: {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  onNavigate?: () => void;
}) {
  if (options.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 px-4 pb-3"
      role="group"
      aria-label="Suggested replies"
    >
      {options.map((option) =>
        option.href ? (
          <Link
            key={option.id}
            href={option.href}
            onClick={onNavigate}
            className="rounded-full border border-border bg-background px-3.5 py-2 font-body text-sm text-text transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {option.label}
          </Link>
        ) : (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className="rounded-full border border-border bg-background px-3.5 py-2 font-body text-sm text-text transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {option.label}
          </button>
        ),
      )}
    </div>
  );
}
