"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlan, isPlanId } from "@/lib/billing/plans";

export async function approveBillingRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request } = await supabase
    .from("billing_requests")
    .select("id, organization_id, plan, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return { error: "Request not found." };
  if (request.status !== "pending") {
    return { error: "This request was already reviewed." };
  }
  if (!isPlanId(request.plan))
    return { error: "Unknown plan on this request." };

  const plan = getPlan(request.plan);

  // Never let this silently fail to update the org — someone paid,
  // this must not result in them getting nothing.
  const { error: orgError } = await supabase
    .from("organizations")
    .update({
      plan: request.plan,
      status: "active",
      monthly_message_limit: plan.monthlyMessageLimit,
    })
    .eq("id", request.organization_id);

  if (orgError) {
    console.error(
      `[billing] CRITICAL: failed to activate org ${request.organization_id} for approved request ${requestId}:`,
      orgError,
    );
    return { error: `Failed to update organization: ${orgError.message}` };
  }

  // Reseller cascade — if the approved org is itself a reseller, every
  // sub-client under it should immediately reflect the new plan/limit
  // too, since sub-clients don't submit their own billing requests
  // (see docs/reseller-billing-model.md). Without this, upgrading the
  // reseller would leave every existing sub-client silently stuck on
  // whatever plan they happened to be created with.
  const { data: resellerOrg } = await supabase
    .from("organizations")
    .select("is_reseller")
    .eq("id", request.organization_id)
    .maybeSingle();

  if (resellerOrg?.is_reseller) {
    const { error: cascadeError } = await supabase
      .from("organizations")
      .update({
        plan: request.plan,
        status: "active",
        monthly_message_limit: plan.monthlyMessageLimit,
      })
      .eq("parent_organization_id", request.organization_id);

    if (cascadeError) {
      console.error(
        `[billing] Failed to cascade plan to sub-clients of reseller ${request.organization_id}:`,
        cascadeError,
      );
      // Non-fatal — the reseller's own org is already correctly
      // activated above; this just means sub-clients need a manual
      // fix or the next approval cycle to catch up.
    }
  }

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      organization_id: request.organization_id,
      // Manual billing — no Stripe ids. current_period_end tracks when
      // to prompt the client for renewal (30 days from approval).
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    { onConflict: "organization_id" },
  );
  if (subError)
    console.error("[billing] subscriptions upsert failed:", subError);

  const { error: reqError } = await supabase
    .from("billing_requests")
    .update({
      status: "approved",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (reqError) return { error: reqError.message };

  revalidatePath("/admin/billing");
  revalidatePath(`/admin/organizations/${request.organization_id}`);
  return { error: null };
}

export async function rejectBillingRequest(requestId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("billing_requests")
    .update({
      status: "rejected",
      rejection_reason: reason || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/admin/billing");
  return { error: null };
}
