/**
 * Normalizes Meta's three different webhook payload shapes (WhatsApp,
 * Messenger, Instagram) into one common shape the webhook route can
 * process identically regardless of source channel.
 *
 * IMPORTANT: `externalAccountId` here is the WABA ID (WhatsApp) or
 * Page/IG Business ID (Messenger/Instagram) — this is used ONLY to
 * look up the matching channel_connections row. It is never trusted
 * as an org/agent identifier directly (see webhook route, Section 5.2
 * of the spec).
 */

export type NormalizedChannel = "whatsapp" | "messenger" | "instagram";

export interface NormalizedInboundMessage {
  channel: NormalizedChannel;
  externalAccountId: string; // WABA ID / Page ID / IG Business ID — for connection lookup
  externalThreadId: string; // sender's ID (phone number / PSID / IGSID) — becomes visitor_id
  text: string;
  timestamp: string; // ISO string
  rawMessageId?: string;
}

/**
 * Returns an array because a single webhook POST can contain multiple
 * entries/messages batched together (Meta does this under load).
 */
export function parseInboundPayload(body: unknown): NormalizedInboundMessage[] {
  if (!body || typeof body !== "object") return [];
  const payload = body as Record<string, unknown>;
  const object = payload.object as string | undefined;
  const entries = (payload.entry as unknown[]) ?? [];

  if (object === "whatsapp_business_account") {
    return parseWhatsAppEntries(entries);
  }

  if (object === "page" || object === "instagram") {
    const channel: NormalizedChannel =
      object === "instagram" ? "instagram" : "messenger";
    return parseMessengerLikeEntries(entries, channel);
  }

  return [];
}

function parseWhatsAppEntries(entries: unknown[]): NormalizedInboundMessage[] {
  const results: NormalizedInboundMessage[] = [];

  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const wabaId = e.id as string | undefined;
    const changes = (e.changes as unknown[]) ?? [];

    for (const change of changes) {
      const c = change as Record<string, unknown>;
      const value = c.value as Record<string, unknown> | undefined;
      if (!value) continue;

      const messages = (value.messages as unknown[]) ?? [];
      for (const msg of messages) {
        const m = msg as Record<string, unknown>;
        // Only handle plain text messages for now — images/audio/etc.
        // can be added later without changing this shape.
        if (m.type !== "text") continue;

        const textObj = m.text as Record<string, unknown> | undefined;
        const body = textObj?.body as string | undefined;
        if (!body || !wabaId) continue;

        results.push({
          channel: "whatsapp",
          externalAccountId: wabaId,
          externalThreadId: String(m.from),
          text: body,
          timestamp: m.timestamp
            ? new Date(Number(m.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          rawMessageId: m.id as string | undefined,
        });
      }
    }
  }

  return results;
}

function parseMessengerLikeEntries(
  entries: unknown[],
  channel: NormalizedChannel,
): NormalizedInboundMessage[] {
  const results: NormalizedInboundMessage[] = [];

  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const accountId = e.id as string | undefined;
    const messaging = (e.messaging as unknown[]) ?? [];

    for (const event of messaging) {
      const ev = event as Record<string, unknown>;
      const sender = ev.sender as Record<string, unknown> | undefined;
      const message = ev.message as Record<string, unknown> | undefined;

      // Skip echoes (messages the page itself sent) and postbacks for now.
      if (!message || message.is_echo || !message.text || !accountId) continue;
      if (!sender?.id) continue;

      results.push({
        channel,
        externalAccountId: accountId,
        externalThreadId: String(sender.id),
        text: String(message.text),
        timestamp: ev.timestamp
          ? new Date(Number(ev.timestamp)).toISOString()
          : new Date().toISOString(),
        rawMessageId: message.mid as string | undefined,
      });
    }
  }

  return results;
}
