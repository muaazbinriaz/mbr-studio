import { createAdminClient } from "@/lib/supabase/admin";
import type { NormalizedChannel } from "@/lib/channels/parse-inbound";

export interface ResolvedConnection {
  id: string;
  agentId: string;
  organizationId: string;
  accessTokenEncrypted: string;
  phoneNumberId: string | null;
}

/**
 * Resolves a channel_connections row from the externalAccountId found
 * in the webhook payload (WABA ID / Page ID / IG Business ID).
 *
 * This is the ONLY trusted path from "something in the payload" to an
 * organization/agent — never derive org/agent from anything else in
 * the payload body directly.
 */
export async function resolveChannelConnection(
  channel: NormalizedChannel,
  externalAccountId: string,
): Promise<ResolvedConnection | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("channel_connections")
    .select(
      "id, agent_id, organization_id, access_token, phone_number_id, status",
    )
    .eq("channel", channel)
    .eq("external_account_id", externalAccountId)
    .eq("status", "connected")
    .maybeSingle();

  if (error || !data || !data.access_token) return null;

  return {
    id: data.id,
    agentId: data.agent_id,
    organizationId: data.organization_id,
    accessTokenEncrypted: data.access_token,
    phoneNumberId: data.phone_number_id,
  };
}
