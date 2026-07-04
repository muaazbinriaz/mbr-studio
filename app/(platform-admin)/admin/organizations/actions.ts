"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/formatters";

function generatePublicKey() {
  return `clx_${randomBytes(16).toString("hex")}`;
}

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Organization name is required." };
  }

  const supabase = await createClient();

  // Guard against RLS silently no-op'ing this for a non-admin — the
  // "org members can access their own org" policy's WITH CHECK would
  // otherwise reject the insert anyway, but failing loudly here gives
  // a clearer error than a generic Postgres RLS violation message.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

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

  // NOTE: as a non-reseller org with no organization_members row yet,
  // the creating admin can still manage it because the "admins" RLS
  // bypass (public.is_admin()) covers every table's policy. A real
  // client user will be attached via organization_members once
  // invite flows exist (Prompt 06/07) — out of scope here.

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
