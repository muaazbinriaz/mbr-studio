import { getPlan } from "@/lib/billing/plans";

/**
 * Gate for connecting a channel (Prompt 04's /dashboard/channels
 * actions) against the org's current plan. Call this at the top of
 * connectWhatsApp / connectMessenger / connectInstagram before the
 * existing upsert logic, e.g.:
 *
 *   const { data: org } = await supabase
 *     .from("organizations").select("plan").eq("id", agent.organization_id).maybeSingle();
 *   if (!isChannelAllowedForPlan(org?.plan ?? "starter", "whatsapp")) {
 *     return { error: "Your plan doesn't include WhatsApp — upgrade from Settings > Billing." };
 *   }
 */
export function isChannelAllowedForPlan(
  planId: string,
  channel: string,
): boolean {
  const plan = getPlan(planId);
  return (plan.channels as readonly string[]).includes(channel);
}
