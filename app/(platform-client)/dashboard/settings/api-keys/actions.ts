"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api/keys";

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

export async function createApiKey(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Give this key a label." };

  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").insert({
    organization_id: organizationId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/api-keys");
  // Only place the raw key is ever returned — never logged, never stored.
  return { error: null, rawKey };
}

export async function revokeApiKey(keyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId);

  revalidatePath("/dashboard/settings/api-keys");
  return { error: error?.message ?? null };
}
