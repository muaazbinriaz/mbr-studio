"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isPlanId } from "@/lib/billing/plans";

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

export async function submitBillingRequest(formData: FormData) {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return { error: "No organization found." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plan = String(formData.get("plan") ?? "");
  const billingPeriod = String(formData.get("billing_period") ?? "monthly");
  const paymentMethod = String(formData.get("payment_method") ?? "");
  const paymentReference = String(
    formData.get("payment_reference") ?? "",
  ).trim();

  if (!isPlanId(plan)) return { error: "Select a valid plan." };
  if (!paymentMethod) return { error: "Select a payment method." };
  if (!paymentReference) {
    return {
      error: "Enter a transaction reference so we can confirm your payment.",
    };
  }

  // One pending request at a time per org — avoids the admin inbox
  // filling up with duplicates from a double-submit.
  const { data: existingPending } = await supabase
    .from("billing_requests")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    return {
      error:
        "You already have a request pending review — please wait for that to be confirmed.",
    };
  }

  const { error } = await supabase.from("billing_requests").insert({
    organization_id: organizationId,
    plan,
    billing_period: billingPeriod,
    payment_method: paymentMethod,
    payment_reference: paymentReference,
    requested_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/billing");
  return { error: null };
}
