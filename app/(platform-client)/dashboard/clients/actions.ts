"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/formatters";

async function getCurrentResellerOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(is_reseller, plan, status, monthly_message_limit)",
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    is_reseller: boolean;
    plan: string;
    status: string;
    monthly_message_limit: number;
  } | null;
  if (!membership || !org?.is_reseller) return null;

  return {
    orgId: membership.organization_id as string,
    plan: org.plan,
    status: org.status,
    monthlyMessageLimit: org.monthly_message_limit,
  };
}

function generatePublicKey() {
  return `clx_${randomBytes(16).toString("hex")}`;
}

export async function addClient(formData: FormData) {
  const reseller = await getCurrentResellerOrg();
  if (!reseller) return { error: "Your organization is not a reseller." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Client name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${randomBytes(2).toString("hex")}`;

  // Sub-client inherits the reseller's CURRENT plan/status/limit at
  // creation time — keeps channel-gating (isChannelAllowedForPlan)
  // correct immediately instead of silently defaulting to 'starter'.
  // If the reseller upgrades later, approveBillingRequest() cascades
  // the new plan to every existing sub-org too (see admin/billing/actions.ts).
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      parent_organization_id: reseller.orgId,
      plan: reseller.plan,
      status: reseller.status,
      monthly_message_limit: reseller.monthlyMessageLimit,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: orgError?.message ?? "Failed to create client." };
  }

  // Reseller becomes owner by default (Section 4.2 — the reseller can
  // later invite the end-client and step down to admin/viewer once an
  // invite flow exists; not built yet, tracked as a follow-up).
  await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: user!.id,
    role: "owner",
  });

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .insert({ organization_id: org.id, name: "Default Agent" })
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

  if (embedKeyError) return { error: embedKeyError.message };

  revalidatePath("/dashboard/clients");
  return { error: null };
}
