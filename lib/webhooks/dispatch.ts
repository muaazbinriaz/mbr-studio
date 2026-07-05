import { createAdminClient } from "@/lib/supabase/admin";
import { signWebhookPayload } from "@/lib/webhooks/sign";

const MAX_ATTEMPTS = 5;
// Backoff schedule indexed by attempt number (attempts already made).
const BACKOFF_MINUTES = [0, 1, 5, 15, 60];
const BATCH_LIMIT = 100;

export async function dispatchPendingWebhooks(): Promise<{
  processed: number;
  delivered: number;
  failed: number;
}> {
  const supabase = createAdminClient();

  const { data: events } = await supabase
    .from("webhook_events")
    .select(
      "id, organization_id, event_type, payload, delivery_attempts, last_attempt_at, created_at",
    )
    .is("delivered_at", null)
    .lt("delivery_attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  let delivered = 0;
  let failed = 0;

  for (const event of events ?? []) {
    // Respect backoff — skip if not enough time has passed since last attempt.
    if (event.last_attempt_at) {
      const waitMinutes =
        BACKOFF_MINUTES[
          Math.min(event.delivery_attempts, BACKOFF_MINUTES.length - 1)
        ];
      const nextEligible =
        new Date(event.last_attempt_at).getTime() + waitMinutes * 60_000;
      if (Date.now() < nextEligible) continue;
    }

    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("id, target_url, secret, subscribed_events")
      .eq("organization_id", event.organization_id)
      .eq("is_active", true)
      .contains("subscribed_events", [event.event_type]);

    if (!endpoints || endpoints.length === 0) {
      // No subscriber for this event — mark delivered so it doesn't
      // loop forever with zero endpoints to try.
      await supabase
        .from("webhook_events")
        .update({ delivered_at: new Date().toISOString() })
        .eq("id", event.id);
      continue;
    }

    const body = JSON.stringify({
      event_type: event.event_type,
      created_at: event.created_at,
      data: event.payload,
    });

    let anySucceeded = false;
    let lastError = "";

    for (const endpoint of endpoints) {
      const signature = signWebhookPayload(body, endpoint.secret);
      try {
        const res = await fetch(endpoint.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event.event_type,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          anySucceeded = true;
        } else {
          lastError = `HTTP ${res.status}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "fetch failed";
      }
    }

    const nextAttempts = event.delivery_attempts + 1;

    if (anySucceeded) {
      await supabase
        .from("webhook_events")
        .update({
          delivered_at: new Date().toISOString(),
          delivery_attempts: nextAttempts,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      delivered++;
    } else {
      await supabase
        .from("webhook_events")
        .update({
          delivery_attempts: nextAttempts,
          last_attempt_at: new Date().toISOString(),
          last_error: lastError,
        })
        .eq("id", event.id);
      failed++;
    }
  }

  return { processed: events?.length ?? 0, delivered, failed };
}
