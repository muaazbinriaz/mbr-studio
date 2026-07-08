"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function saveOrgBasics(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Business name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", organizationId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

export async function saveBranding(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const primaryColor = String(formData.get("primary_color") ?? "#6366f1");
  const accentColor = String(formData.get("accent_color") ?? "#06b6d4");
  const welcomeMessage = String(formData.get("welcome_message") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      primary_color: primaryColor,
      accent_color: accentColor,
      welcome_message: welcomeMessage || "Hi! How can I help you today?",
      logo_url: logoUrl || null,
    })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

/**
 * Wizard ke last step pe call hota hai. dashboard/page.tsx isi flag ko
 * check karke naye user ko onboarding pe redirect karta hai jab tak
 * ye true na ho jaye.
 */
export async function markOnboardingComplete() {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ setup_complete: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

/**
 * Self-reported checkbox for the getting-started checklist — "I added
 * the embed code to my site." Can't be verified automatically, so it's
 * explicitly labeled as self-reported in the UI.
 */
export async function markEmbedAdded() {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ embed_added_self_reported: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) return { error: "Something went wrong — try again." };

  revalidatePath("/dashboard");
  return { error: null };
}
