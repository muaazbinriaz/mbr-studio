export type ChatOption = {
  id: string;
  label: string;
  /** If present, renders as a navigation link instead of sending a message. */
  href?: string;
};

/**
 * Quick-start suggestion chips shown when the chat first opens.
 * Clicking one sends `label` as a real user message into the AI SDK
 * chat (see ChatWindow.tsx) — it no longer drives a scripted stage
 * machine. SERVICE_OPTIONS / BUDGET_OPTIONS / WORK_OPTIONS were
 * removed along with the stage machine that consumed them; the real
 * model now handles qualification via the system prompt + tools.
 */
export const OPENING_OPTIONS: ChatOption[] = [
  { id: "quote", label: "Get a quote" },
  { id: "consultation", label: "Book a consultation" },
  { id: "services", label: "Explore our services" },
  { id: "work", label: "See past work" },
];
