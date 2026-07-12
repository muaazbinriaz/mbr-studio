"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentOrgId,
  getActiveAgentForCurrentUser,
} from "@/lib/auth/actions";

export async function saveOrgBasics(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give your business a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function saveAgentName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give your agent a name." };

  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ name: trimmed })
    .eq("id", agent.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

// Persists which step the user is on so closing the tab and coming back
// resumes exactly where they left off, instead of restarting at step 0.
export async function saveOnboardingStep(step: number) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ onboarding_step: step })
    .eq("id", agent.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

export async function saveBranding(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const primaryColor = String(formData.get("primary_color") ?? "").trim();
  const accentColor = String(formData.get("accent_color") ?? "").trim();
  const welcomeMessage = String(formData.get("welcome_message") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const widgetPositionRaw = String(
    formData.get("widget_position") ?? "",
  ).trim();
  const widgetPosition =
    widgetPositionRaw === "bottom-left" ? "bottom-left" : "bottom-right";

  if (!welcomeMessage) {
    return { error: "Welcome message can't be empty." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      primary_color: primaryColor || "#6366f1",
      accent_color: accentColor || "#06b6d4",
      welcome_message: welcomeMessage,
      logo_url: logoUrl || null,
      widget_position: widgetPosition,
    })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard/appearance");
  return { error: null };
}

export async function markEmbedAdded() {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) {
    return { error: "No active agent found for your organization." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ embed_added_self_reported: true })
    .eq("id", agent.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

export async function markOnboardingComplete() {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) {
    return { error: "No active agent found for your organization." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ setup_complete: true })
    .eq("id", agent.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}
