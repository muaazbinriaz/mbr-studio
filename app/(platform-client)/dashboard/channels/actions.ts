"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/channels/encryption";
import { verifyMetaCredential } from "@/lib/channels/verify-credential";
import { sendWhatsAppMessage } from "@/lib/channels/send";
import { isChannelAllowedForPlan } from "@/lib/billing/limits";
import { getActiveAgentForCurrentUser } from "@/lib/auth/actions";

/**
 * Plan gate — checked before any channel connect goes through. Returns
 * an error string if the org's current plan doesn't include this
 * channel, or null if it's allowed. Centralized here so all three
 * connect* actions below check it the same way.
 */
async function checkChannelPlanGate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  channel: string,
): Promise<string | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", organizationId)
    .maybeSingle();

  if (!isChannelAllowedForPlan(org?.plan ?? "starter", channel)) {
    return `Your current plan doesn't include ${channel} — upgrade from Settings > Billing to connect this channel.`;
  }
  return null;
}

export async function connectWhatsApp(formData: FormData) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const supabase = await createClient();
  const planError = await checkChannelPlanGate(
    supabase,
    agent.organization_id,
    "whatsapp",
  );
  if (planError) return { error: planError };

  const wabaId = String(formData.get("waba_id") ?? "").trim();
  const phoneNumberId = String(formData.get("phone_number_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!wabaId || !phoneNumberId || !accessToken) {
    return { error: "All fields are required." };
  }

  const verification = await verifyMetaCredential(phoneNumberId, accessToken);
  if (!verification.ok) return { error: verification.error };

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

  const supabase = await createClient();
  const planError = await checkChannelPlanGate(
    supabase,
    agent.organization_id,
    "messenger",
  );
  if (planError) return { error: planError };

  const pageId = String(formData.get("page_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!pageId || !accessToken) {
    return { error: "All fields are required." };
  }

  const verification = await verifyMetaCredential(pageId, accessToken);
  if (!verification.ok) return { error: verification.error };

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

  const supabase = await createClient();
  const planError = await checkChannelPlanGate(
    supabase,
    agent.organization_id,
    "instagram",
  );
  if (planError) return { error: planError };

  const igBusinessId = String(formData.get("ig_business_id") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();

  if (!igBusinessId || !accessToken) {
    return { error: "All fields are required." };
  }

  const verification = await verifyMetaCredential(igBusinessId, accessToken);
  if (!verification.ok) return { error: verification.error };

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
