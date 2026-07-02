"use client";

import type { ComponentType } from "react";
import {
  MessageSquareText,
  CalendarCheck,
  Layers,
  FolderGit2,
} from "lucide-react";
import type { ChatOption } from "@/components/chatbot/chatbot";

const ICONS: Record<
  string,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  quote: MessageSquareText,
  consultation: CalendarCheck,
  services: Layers,
  work: FolderGit2,
};

export function OpeningOptions({
  options,
  onSelect,
}: {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-3">
      {options.map((option) => {
        const Icon = ICONS[option.id] ?? MessageSquareText;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-background p-3 text-left transition-colors duration-200 hover:border-primary"
          >
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <span className="font-body text-sm text-text">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
