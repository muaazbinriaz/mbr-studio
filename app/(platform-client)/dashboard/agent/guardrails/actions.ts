"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAgentForCurrentUser } from "@/lib/auth/actions";

export async function saveGuardrails(formData: FormData) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const supabase = await createClient();

  const customRulesRaw = String(formData.get("custom_rules") ?? "").trim();

  const leadCaptureSettings = {
    ask_name: formData.get("lead_ask_name") === "on",
    ask_email: formData.get("lead_ask_email") === "on",
    ask_phone: formData.get("lead_ask_phone") === "on",
    ask_message: formData.get("lead_ask_message") === "on",
  };

  const payload = {
    agent_id: agent.id,
    no_competitors: formData.get("no_competitors") === "on",
    stay_on_topic: formData.get("stay_on_topic") === "on",
    no_pricing: formData.get("no_pricing") === "on",
    always_polite: formData.get("always_polite") === "on",
    no_opinions: formData.get("no_opinions") === "on",
    push_contact: formData.get("push_contact") === "on",
    no_refund_promise: formData.get("no_refund_promise") === "on",
    capture_leads: formData.get("capture_leads") === "on",
    tone: String(formData.get("tone") ?? "professional"),
    reply_language: String(formData.get("reply_language") ?? "auto"),
    custom_rules: customRulesRaw.length > 0 ? customRulesRaw : null,
    lead_capture_settings: leadCaptureSettings,
  };

  const { error } = await supabase
    .from("agent_guardrails")
    .upsert(payload, { onConflict: "agent_id" });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/agent/guardrails");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}
