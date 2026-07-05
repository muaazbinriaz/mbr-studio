"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/channels/encryption";

import { triggerWebhookDispatch } from "@/lib/webhooks/trigger";
import {
  sendWhatsAppMessage,
  sendMessengerMessage,
  sendInstagramMessage,
} from "@/lib/channels/send";

type ActionResult = { error: string | null };

async function getCurrentUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Takeover (Section 3.3 + 3.4). The `.eq("assigned_user_id", null)` OR
 * "already mine" check is the optimistic lock: the UPDATE only
 * matches a row if nobody else has claimed it yet (or the caller
 * already owns it), so two staff clicking "Take over" at the same
 * moment can't both silently win — whoever's UPDATE lands second
 * matches zero rows and gets a clear "already taken" error instead of
 * overwriting the first staff member's assignment.
 */
export async function takeoverConversation(
  conversationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("conversations")
    .update({ status: "human_handling", assigned_user_id: userId })
    .eq("id", conversationId)
    .neq("status", "resolved")
    .or(`assigned_user_id.is.null,assigned_user_id.eq.${userId}`)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) {
    return {
      error:
        "This conversation was just taken over by someone else — refresh to see who.",
    };
  }

  revalidatePath("/dashboard/inbox");
  return { error: null };
}

export async function handBackToAI(
  conversationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { error: "Not authenticated." };

  // Same optimistic-lock shape as takeover — only the currently
  // assigned staff member (or an admin, covered by RLS) can hand back.
  const { data, error } = await supabase
    .from("conversations")
    .update({ status: "ai_handling", assigned_user_id: null })
    .eq("id", conversationId)
    .eq("assigned_user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) {
    return { error: "You're no longer assigned to this conversation." };
  }

  revalidatePath("/dashboard/inbox");
  return { error: null };
}

export async function resolveConversation(
  conversationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: conversation, error: fetchError } = await supabase
    .from("conversations")
    .select("id, organization_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (fetchError || !conversation) {
    return { error: fetchError?.message ?? "Conversation not found." };
  }

  const { error } = await supabase
    .from("conversations")
    .update({ status: "resolved", assigned_user_id: null })
    .eq("id", conversationId);

  if (error) return { error: error.message };

  // Forward-looking per Prompt 01's webhook design — Prompt 07 will
  // add a real dispatcher; this just makes sure the event exists.
  await supabase.from("webhook_events").insert({
    organization_id: conversation.organization_id,
    event_type: "conversation.resolved",
    payload: { conversation_id: conversationId },
  });
  triggerWebhookDispatch();
  revalidatePath("/dashboard/inbox");
  return { error: null };
}

/**
 * Sends a human agent's reply and routes it out on the right channel.
 *
 * For `channel: 'website'` there is no outbound API call — inserting
 * the `messages` row is the entire delivery mechanism, since the
 * open widget is subscribed to Realtime for its own conversation_id
 * (see Section 3.3 / the widget update) and will receive it directly.
 */
export async function sendHumanReply(
  conversationId: string,
  content: string,
): Promise<ActionResult> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Message can't be empty." };

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return { error: "Not authenticated." };

  const { data: conversation, error: fetchError } = await supabase
    .from("conversations")
    .select(
      "id, agent_id, organization_id, channel, channel_thread_id, status, assigned_user_id",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (fetchError || !conversation) {
    return { error: fetchError?.message ?? "Conversation not found." };
  }

  if (
    conversation.status !== "human_handling" ||
    conversation.assigned_user_id !== userId
  ) {
    return {
      error: "You need to take over this conversation before replying.",
    };
  }

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: conversation.agent_id,
    organization_id: conversation.organization_id,
    role: "human_agent",
    content: trimmed,
  });
  if (insertError) return { error: insertError.message };

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Website: nothing further to do — Realtime delivers it.
  if (conversation.channel === "website") {
    revalidatePath("/dashboard/inbox");
    return { error: null };
  }

  // WhatsApp / Messenger / Instagram: fetch the connection and send
  // through the matching Prompt 04 function.
  if (!conversation.channel_thread_id) {
    return {
      error:
        "Message saved, but this conversation has no channel thread id to reply to.",
    };
  }

  const { data: connection } = await supabase
    .from("channel_connections")
    .select("access_token, phone_number_id")
    .eq("agent_id", conversation.agent_id)
    .eq("channel", conversation.channel)
    .eq("status", "connected")
    .maybeSingle();

  if (!connection) {
    return {
      error:
        "Message saved, but no connected channel was found to send it through.",
    };
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(connection.access_token);
  } catch {
    return {
      error:
        "Message saved, but the channel's access token could not be decrypted.",
    };
  }

  let sent = false;
  if (conversation.channel === "whatsapp" && connection.phone_number_id) {
    sent = await sendWhatsAppMessage(
      connection.phone_number_id,
      accessToken,
      conversation.channel_thread_id,
      trimmed,
    );
  } else if (conversation.channel === "messenger") {
    sent = await sendMessengerMessage(
      accessToken,
      conversation.channel_thread_id,
      trimmed,
    );
  } else if (conversation.channel === "instagram") {
    sent = await sendInstagramMessage(
      accessToken,
      conversation.channel_thread_id,
      trimmed,
    );
  }

  revalidatePath("/dashboard/inbox");

  if (!sent) {
    return {
      error: "Message saved, but delivery to the channel failed — see logs.",
    };
  }
  return { error: null };
}

/**
 * Marks the inbox "seen" for the calling user in this org — clears
 * the unread badge. Called when the inbox page mounts / is focused.
 */
export async function markInboxSeen(organizationId: string): Promise<void> {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) return;

  await supabase.from("inbox_last_seen").upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,organization_id" },
  );
}
