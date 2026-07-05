"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/channels/encryption";
import { sendWhatsAppMessage } from "@/lib/channels/send";

async function getActiveAgentForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: agent } = await supabase
    .from("agents")
    .select("id, organization_id")
    .eq("organization_id", membership.organization_id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return agent;
}

export async function connectWhatsApp(formData: FormData) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const wabaId = String(formData.get("waba_id") ?? "").trim();
  const phoneNumberId = String(formData.get("phone_number_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!wabaId || !phoneNumberId || !accessToken) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();
  const encrypted = encryptToken(accessToken);

  const { error } = await supabase.from("channel_connections").upsert(
    {
      agent_id: agent.id,
      organization_id: agent.organization_id,
      channel: "whatsapp",
      external_account_id: wabaId,
      phone_number_id: phoneNumberId,
      access_token: encrypted,
      status: "connected",
      linked_agent_id: agent.id,
    },
    { onConflict: "agent_id,channel" },
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/channels");
  return { error: null };
}

export async function connectMessenger(formData: FormData) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const pageId = String(formData.get("page_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!pageId || !accessToken) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();
  const encrypted = encryptToken(accessToken);

  const { error } = await supabase.from("channel_connections").upsert(
    {
      agent_id: agent.id,
      organization_id: agent.organization_id,
      channel: "messenger",
      external_account_id: pageId,
      access_token: encrypted,
      status: "connected",
      linked_agent_id: agent.id,
    },
    { onConflict: "agent_id,channel" },
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/channels");
  return { error: null };
}

export async function connectInstagram(formData: FormData) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const igBusinessId = String(formData.get("ig_business_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!igBusinessId || !accessToken) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();
  const encrypted = encryptToken(accessToken);

  const { error } = await supabase.from("channel_connections").upsert(
    {
      agent_id: agent.id,
      organization_id: agent.organization_id,
      channel: "instagram",
      external_account_id: igBusinessId,
      access_token: encrypted,
      status: "connected",
      linked_agent_id: agent.id,
    },
    { onConflict: "agent_id,channel" },
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/channels");
  return { error: null };
}

export async function disconnectChannel(connectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("channel_connections")
    .update({ status: "disconnected" })
    .eq("id", connectionId);

  revalidatePath("/dashboard/channels");
  return { error: error?.message ?? null };
}

export async function sendTestMessage(
  connectionId: string,
  testPhoneNumber: string,
) {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("channel_connections")
    .select("channel, phone_number_id, access_token")
    .eq("id", connectionId)
    .maybeSingle();

  if (
    !connection ||
    connection.channel !== "whatsapp" ||
    !connection.phone_number_id
  ) {
    return { error: "Only WhatsApp test messages are supported right now." };
  }

  const { decryptToken } = await import("@/lib/channels/encryption");
  const accessToken = decryptToken(connection.access_token);

  const sent = await sendWhatsAppMessage(
    connection.phone_number_id,
    accessToken,
    testPhoneNumber,
    "This is a test message from your MBR Studio AI agent. If you received this, your WhatsApp connection works!",
  );

  return sent ? { error: null } : { error: "Failed to send test message." };
}
