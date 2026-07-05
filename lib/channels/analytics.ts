import { createAdminClient } from "@/lib/supabase/admin";

export async function bumpChannelAnalytics(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  organizationId: string,
  channel: string,
  fields: Partial<{
    total_conversations: number;
    total_messages: number;
    resolved_by_ai: number;
    unique_visitors: number;
  }>,
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("agent_daily_analytics")
    .select(
      "id, total_conversations, total_messages, resolved_by_ai, unique_visitors",
    )
    .eq("agent_id", agentId)
    .eq("date", today)
    .eq("channel", channel)
    .maybeSingle();

  if (!existing) {
    await supabase.from("agent_daily_analytics").insert({
      agent_id: agentId,
      organization_id: organizationId,
      date: today,
      channel,
      total_conversations: fields.total_conversations ?? 0,
      total_messages: fields.total_messages ?? 0,
      resolved_by_ai: fields.resolved_by_ai ?? 0,
      unique_visitors: fields.unique_visitors ?? 0,
    });
    return;
  }

  await supabase
    .from("agent_daily_analytics")
    .update({
      total_conversations:
        existing.total_conversations + (fields.total_conversations ?? 0),
      total_messages: existing.total_messages + (fields.total_messages ?? 0),
      resolved_by_ai: existing.resolved_by_ai + (fields.resolved_by_ai ?? 0),
      unique_visitors: existing.unique_visitors + (fields.unique_visitors ?? 0),
    })
    .eq("id", existing.id);
}
