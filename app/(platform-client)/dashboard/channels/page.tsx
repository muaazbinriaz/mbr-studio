import { createClient } from "@/lib/supabase/server";
import { ChannelsClient } from "./ChannelsClient";
import { maskToken, decryptToken } from "@/lib/channels/encryption";
import { LockedFeatureEmptyState } from "@/components/platform/LockedFeatureEmptyState";

export default async function ChannelsPage() {
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

  let agentId: string | null = null;
  let setupComplete = false;
  let connections: {
    id: string;
    channel: string;
    external_account_id: string;
    phone_number_id: string | null;
    status: string;
    maskedToken: string;
  }[] = [];

  if (membership) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id, setup_complete")
      .eq("organization_id", membership.organization_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    agentId = agent?.id ?? null;
    setupComplete = agent?.setup_complete ?? false;

    if (agentId && setupComplete) {
      const { data: rows } = await supabase
        .from("channel_connections")
        .select(
          "id, channel, external_account_id, phone_number_id, status, access_token",
        )
        .eq("agent_id", agentId);

      connections = (rows ?? []).map((row) => {
        let maskedToken = "••••";
        try {
          const decrypted = decryptToken(row.access_token);
          maskedToken = maskToken(decrypted);
        } catch {
          // If decryption fails (bad/legacy value), just show generic mask.
        }
        return {
          id: row.id,
          channel: row.channel,
          external_account_id: row.external_account_id,
          phone_number_id: row.phone_number_id,
          status: row.status,
          maskedToken,
        };
      });
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Channels
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Connect WhatsApp, Instagram, and Messenger so your AI agent answers
        consistently everywhere your customers reach out.
      </p>

      {!agentId ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <p className="font-body text-sm text-secondary-text">
            No active agent found for your organization yet.
          </p>
        </div>
      ) : !setupComplete ? (
        <div className="mt-8">
          <LockedFeatureEmptyState feature="Channels" />
        </div>
      ) : (
        <div className="mt-8">
          <ChannelsClient connections={connections} />
        </div>
      )}
    </div>
  );
}
