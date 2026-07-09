"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth/actions";

export async function takeoverConversation(conversationId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("conversations")
    .update({ status: "human_handling", assigned_user_id: userId })
    .eq("id", conversationId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/inbox");
  return { error: null };
}

export async function handBackToAI(conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ status: "ai_handling", assigned_user_id: null })
    .eq("id", conversationId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/inbox");
  return { error: null };
}

export async function resolveConversation(conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ status: "resolved" })
    .eq("id", conversationId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/inbox");
  return { error: null };
}

export async function sendHumanReply(conversationId: string, content: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("agent_id, organization_id")
    .eq("id", conversationId)
    .single();
  if (convError || !conv) return { error: "Conversation not found" };
  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: conv.agent_id,
    organization_id: conv.organization_id,
    role: "human_agent",
    content,
  });
  if (insertError) return { error: insertError.message };
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  revalidatePath("/dashboard/inbox");
  return { error: null };
}

export async function markInboxSeen(organizationId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("inbox_last_seen").upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,organization_id" },
  );
  if (error) return { error: error.message };
  return { error: null };
}
