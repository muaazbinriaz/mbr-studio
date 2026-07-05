"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateWebhookSecret } from "@/lib/webhooks/sign";
import { WEBHOOK_EVENT_TYPES } from "@/lib/webhooks/events";

async function getCurrentOrgId() {
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

  return membership?.organization_id ?? null;
}

export async function createWebhookEndpoint(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const targetUrl = String(formData.get("target_url") ?? "").trim();
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return { error: "Enter a valid URL starting with http:// or https://" };
  }

  const selectedEvents = WEBHOOK_EVENT_TYPES.filter(
    (evt) => formData.get(`event_${evt}`) === "on",
  );
  if (selectedEvents.length === 0) {
    return { error: "Select at least one event type." };
  }

  const secret = generateWebhookSecret();
  const supabase = await createClient();

  const { error } = await supabase.from("webhook_endpoints").insert({
    organization_id: organizationId,
    target_url: targetUrl,
    secret,
    subscribed_events: selectedEvents,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/webhooks");
  return { error: null, secret };
}

export async function toggleWebhookEndpoint(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("webhook_endpoints")
    .update({ is_active: isActive })
    .eq("id", id);

  revalidatePath("/dashboard/settings/webhooks");
  return { error: error?.message ?? null };
}

export async function deleteWebhookEndpoint(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id);

  revalidatePath("/dashboard/settings/webhooks");
  return { error: error?.message ?? null };
}
