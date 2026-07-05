import { createClient } from "@/lib/supabase/server";
import { WebhooksClient } from "./WebhooksClient";

export default async function WebhooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  let endpoints: {
    id: string;
    target_url: string;
    subscribed_events: string[];
    is_active: boolean;
    created_at: string;
  }[] = [];

  let failedDeliveries: {
    id: string;
    event_type: string;
    delivery_attempts: number;
    last_error: string | null;
    created_at: string;
  }[] = [];

  if (membership) {
    const { data: rows } = await supabase
      .from("webhook_endpoints")
      .select("id, target_url, subscribed_events, is_active, created_at")
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: false });
    endpoints = rows ?? [];

    const { data: failedRows } = await supabase
      .from("webhook_events")
      .select("id, event_type, delivery_attempts, last_error, created_at")
      .eq("organization_id", membership.organization_id)
      .is("delivered_at", null)
      .gt("delivery_attempts", 0)
      .order("created_at", { ascending: false })
      .limit(20);
    failedDeliveries = failedRows ?? [];
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Webhooks
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Get notified in real time when leads come in, conversations resolve, and
        more.{" "}
        <a
          href="/docs/api"
          className="text-primary underline underline-offset-2"
        >
          View API docs
        </a>
      </p>
      <div className="mt-8">
        <WebhooksClient
          endpoints={endpoints}
          failedDeliveries={failedDeliveries}
        />
      </div>
    </div>
  );
}
