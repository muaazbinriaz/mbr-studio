import { after } from "next/server";
import { dispatchPendingWebhooks } from "./dispatch";

/**
 * Call this right after inserting a row into webhook_events.
 * Uses Next.js's after() so the dispatch actually completes even
 * after the response has been sent — plain fire-and-forget promises
 * can get killed mid-flight when the serverless function freezes.
 */
export function triggerWebhookDispatch(): void {
  after(() => {
    dispatchPendingWebhooks().catch((err) => {
      console.error("[webhooks] background dispatch trigger failed:", err);
    });
  });
}
