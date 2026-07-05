import { dispatchPendingWebhooks } from "./dispatch";

/**
 * Fire-and-forget trigger — call this right after inserting a row into
 * webhook_events. Runs the dispatcher immediately in the background so
 * most webhooks deliver in real time, instead of waiting for the daily
 * safety-net cron (see vercel.json + app/api/internal/dispatch-webhooks).
 *
 * Never awaited by callers — a slow/failed dispatch attempt here must
 * never block or fail the request that triggered it.
 */
export function triggerWebhookDispatch(): void {
  dispatchPendingWebhooks().catch((err) => {
    console.error("[webhooks] background dispatch trigger failed:", err);
  });
}
