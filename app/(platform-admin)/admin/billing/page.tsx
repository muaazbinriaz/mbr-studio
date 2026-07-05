import { createClient } from "@/lib/supabase/server";
import { BillingRequestsClient } from "./BillingRequestsClient";

export default async function AdminBillingPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("billing_requests")
    .select(
      "id, plan, billing_period, payment_method, payment_reference, status, requested_at, reviewed_at, rejection_reason, organizations(id, name, slug)",
    )
    .order("requested_at", { ascending: false })
    .limit(100);

  const rows = (requests ?? []).map((r) => {
    const org = r.organizations as unknown as {
      id: string;
      name: string;
      slug: string;
    } | null;
    return {
      id: r.id,
      plan: r.plan,
      billingPeriod: r.billing_period,
      paymentMethod: r.payment_method,
      paymentReference: r.payment_reference,
      status: r.status,
      requestedAt: r.requested_at,
      reviewedAt: r.reviewed_at,
      rejectionReason: r.rejection_reason,
      orgId: org?.id ?? "",
      orgName: org?.name ?? "Unknown organization",
      orgSlug: org?.slug ?? "",
    };
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Billing
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Review and confirm manual payment claims — approving one immediately
        activates the client&apos;s plan.
      </p>
      <div className="mt-8">
        <BillingRequestsClient requests={rows} />
      </div>
    </div>
  );
}
