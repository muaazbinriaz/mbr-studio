import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/channels/verify-signature";
import { parseInboundPayload } from "@/lib/channels/parse-inbound";
import { resolveChannelConnection } from "@/lib/channels/resolve-connection";
import { processInboundMessage } from "@/lib/channels/process-inbound-message";
import { triggerWebhookDispatch } from "@/lib/channels/../webhooks/trigger";
import { after } from "next/server";
import {
  sendWhatsAppMessage,
  sendMessengerMessage,
  sendInstagramMessage,
} from "@/lib/channels/send";
import { bumpChannelAnalytics } from "@/lib/channels/analytics";
import { decryptToken } from "@/lib/channels/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NormalizedInboundMessage } from "@/lib/channels/parse-inbound";
import type { ResolvedConnection } from "@/lib/channels/resolve-connection";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    expectedToken &&
    token === expectedToken
  ) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    console.error("[channels/webhook] Invalid signature — rejecting.");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const messages = parseInboundPayload(payload);

  after(() =>
    handleMessagesAsync(messages).catch((err) => {
      console.error("[channels/webhook] Async processing failed:", err);
    }),
  );

  return NextResponse.json({ status: "ok" });
}

async function handleMessagesAsync(messages: NormalizedInboundMessage[]) {
  const supabase = createAdminClient();

  for (const msg of messages) {
    const connection = await resolveChannelConnection(
      msg.channel,
      msg.externalAccountId,
    );
    if (!connection) {
      console.warn(
        `[channels/webhook] No connected channel_connections row for ${msg.channel}/${msg.externalAccountId} — ignoring.`,
      );
      continue;
    }

    try {
      const result = await processInboundMessage(msg, connection);

      if (result.isNewConversation) {
        await bumpChannelAnalytics(
          supabase,
          result.agentId,
          result.organizationId,
          msg.channel,
          { total_conversations: 1 },
        );
      }

      if (!result.shouldReply || !result.replyText) {
        continue;
      }

      const sent = await sendReply(msg, connection, result.replyText);

      if (sent) {
        await supabase.from("messages").insert({
          conversation_id: result.conversationId,
          agent_id: result.agentId,
          organization_id: result.organizationId,
          role: "assistant",
          content: result.replyText,
        });

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", result.conversationId);

        await bumpChannelAnalytics(
          supabase,
          result.agentId,
          result.organizationId,
          msg.channel,
          { total_messages: 2, resolved_by_ai: 1 },
        );

        await supabase.from("webhook_events").insert({
          organization_id: result.organizationId,
          event_type: "message.received",
          payload: {
            channel: msg.channel,
            thread_id: msg.externalThreadId,
          },
        });
        triggerWebhookDispatch();
      } else {
        console.error(
          `[channels/webhook] Failed to send reply on ${msg.channel} to ${msg.externalThreadId} after retries.`,
        );
      }
    } catch (err) {
      console.error(
        `[channels/webhook] Failed processing message from ${msg.externalThreadId}:`,
        err,
      );
    }
  }
}

async function sendReply(
  msg: NormalizedInboundMessage,
  connection: ResolvedConnection,
  text: string,
): Promise<boolean> {
  const accessToken = decryptToken(connection.accessTokenEncrypted);

  switch (msg.channel) {
    case "whatsapp":
      if (!connection.phoneNumberId) return false;
      return sendWhatsAppMessage(
        connection.phoneNumberId,
        accessToken,
        msg.externalThreadId,
        text,
      );
    case "messenger":
      return sendMessengerMessage(accessToken, msg.externalThreadId, text);
    case "instagram":
      return sendInstagramMessage(accessToken, msg.externalThreadId, text);
    default:
      return false;
  }
}
