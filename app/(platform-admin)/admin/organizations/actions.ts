"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/formatters";
import { requireAdmin } from "@/lib/auth/actions";

function generatePublicKey() {
  return `clx_${randomBytes(16).toString("hex")}`;
}

export async function createOrganization(formData: FormData) {
  const caller = await requireAdmin();
  if (caller.error) return { error: caller.error };

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Organization name is required." };
  }

  const supabase = await createClient();

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${randomBytes(2).toString("hex")}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: orgError?.message ?? "Failed to create organization." };
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .insert({
      organization_id: org.id,
      name: "Default Agent",
    })
    .select("id")
    .single();

  if (agentError || !agent) {
    return { error: agentError?.message ?? "Failed to create default agent." };
  }

  const { error: embedKeyError } = await supabase.from("embed_keys").insert({
    agent_id: agent.id,
    organization_id: org.id,
    public_key: generatePublicKey(),
  });

  if (embedKeyError) {
    return { error: embedKeyError.message };
  }

  revalidatePath("/admin/organizations");
  return { error: null };
}

export async function toggleReseller(organizationId: string, next: boolean) {
  const caller = await requireAdmin();
  if (caller.error) return { error: caller.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ is_reseller: next })
    .eq("id", organizationId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/organizations/${organizationId}`);
  return { error: null };
}

export async function saveResellerBranding(
  organizationId: string,
  formData: FormData,
) {
  const caller = await requireAdmin();
  if (caller.error) return { error: caller.error };

  const supabase = await createClient();
  const brandName = String(formData.get("reseller_brand_name") ?? "").trim();
  const logoUrl = String(formData.get("reseller_logo_url") ?? "").trim();
  const domain = String(formData.get("reseller_domain") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  const { error } = await supabase
    .from("organizations")
    .update({
      reseller_brand_name: brandName || null,
      reseller_logo_url: logoUrl || null,
      reseller_domain: domain || null,
    })
    .eq("id", organizationId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/organizations/${organizationId}`);
  return { error: null };
}
