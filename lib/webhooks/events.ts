// Central list of every event_type this platform emits. Add new ones
// here (e.g. Prompt 08's 'subscription.updated') — the dispatcher
// itself never hardcodes event types, it just reads subscribed_events.
export const WEBHOOK_EVENT_TYPES = [
  "lead.captured",
  "message.received",
  "conversation.resolved",
  "conversation.started",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];
