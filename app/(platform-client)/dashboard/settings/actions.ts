"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { verifyOrganizationDomain } from "@/lib/domain-verify/verify";
import { getCurrentOrgId } from "@/lib/auth/actions";

export async function setPrimaryDomain(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const domain = String(formData.get("domain") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!domain) return { error: "Enter a domain, e.g. yourbusiness.com" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("organizations")
    .select("domain_verify_token")
    .eq("id", organizationId)
    .maybeSingle();

  const token =
    existing?.domain_verify_token || randomBytes(12).toString("hex");

  const { error } = await supabase
    .from("organizations")
    .update({
      primary_domain: domain,
      domain_verify_token: token,
      domain_verify_status: "pending",
      domain_grace_started_at: null,
    })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { error: null };
}

export async function checkDomainNow() {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const result = await verifyOrganizationDomain(organizationId);
  revalidatePath("/dashboard/settings");

  if ("error" in result) return { error: result.error };
  return { error: null, status: result.status, inGrace: result.inGrace };
}
