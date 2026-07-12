import { createClient } from "@/lib/supabase/server";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(plan, status, monthly_message_limit, parent_organization_id)",
    )
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    plan: string;
    status: string;
    monthly_message_limit: number;
    parent_organization_id: string | null;
  } | null;

  let messagesThisMonth = 0;
  let history: {
    id: string;
    plan: string;
    payment_method: string;
    payment_reference: string | null;
    status: string;
    requested_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
  }[] = [];
  let resellerName: string | null = null;

  if (membership) {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .gte("created_at", monthStart);
    messagesThisMonth = count ?? 0;

    if (org?.parent_organization_id) {
      // Sub-client of a reseller — billing is managed upstream, so we
      // just need the reseller's display name for the note, not a
      // request form or history for this org.
      const { data: parent } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", org.parent_organization_id)
        .maybeSingle();
      resellerName = parent?.name ?? "your reseller";
    } else {
      const { data: requests } = await supabase
        .from("billing_requests")
        .select(
          "id, plan, payment_method, payment_reference, status, requested_at, reviewed_at, rejection_reason",
        )
        .eq("organization_id", membership.organization_id)
        .order("requested_at", { ascending: false })
        .limit(20);
      history = requests ?? [];
    }
  }

  const pendingRequest = history.find((r) => r.status === "pending") ?? null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Billing
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        {org?.parent_organization_id
          ? "Your plan is managed by your reseller."
          : "Pick a plan and confirm payment via bank transfer or Easypaisa — an MBR Studio admin activates your plan once payment is confirmed, usually within a few hours."}
      </p>

      <div className="mt-8">
        <BillingClient
          currentPlan={org?.plan ?? "starter"}
          currentStatus={org?.status ?? "trial"}
          monthlyMessageLimit={org?.monthly_message_limit ?? 500}
          messagesThisMonth={messagesThisMonth}
          pendingRequest={pendingRequest}
          history={history}
          managedByReseller={!!org?.parent_organization_id}
          resellerName={resellerName}
        />
      </div>
    </div>
  );
}
