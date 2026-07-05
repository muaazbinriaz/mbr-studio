import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface DailyAnalyticsPoint {
  date: string;
  conversations: number;
  messages: number;
  resolvedByAi: number;
  uniqueVisitors: number;
}

export interface OrgAnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  resolvedByAi: number;
  uniqueVisitors: number;
  resolutionRate: number;
  daily: DailyAnalyticsPoint[];
}

function startOfRange(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Summed across every agent in the org and across channel (only
 * 'website' exists today — Prompt 04 adds more channels without this
 * query needing to change; a channel filter tab can layer on top of
 * this same query later).
 */
export async function getOrgAnalyticsSummary(
  supabase: SupabaseServerClient,
  organizationId: string,
  days: number = 30,
): Promise<OrgAnalyticsSummary> {
  const since = startOfRange(days);

  const { data: rows } = await supabase
    .from("agent_daily_analytics")
    .select(
      "date, channel, total_conversations, total_messages, resolved_by_ai, unique_visitors",
    )
    .eq("organization_id", organizationId)
    .gte("date", since)
    .order("date", { ascending: true });

  const byDate = new Map<string, DailyAnalyticsPoint>();
  for (const date of buildDateRange(days)) {
    byDate.set(date, {
      date,
      conversations: 0,
      messages: 0,
      resolvedByAi: 0,
      uniqueVisitors: 0,
    });
  }

  let totalConversations = 0;
  let totalMessages = 0;
  let resolvedByAi = 0;
  let uniqueVisitors = 0;

  for (const row of rows ?? []) {
    const point = byDate.get(row.date);
    if (point) {
      point.conversations += row.total_conversations;
      point.messages += row.total_messages;
      point.resolvedByAi += row.resolved_by_ai;
      point.uniqueVisitors += row.unique_visitors;
    }
    totalConversations += row.total_conversations;
    totalMessages += row.total_messages;
    resolvedByAi += row.resolved_by_ai;
    uniqueVisitors += row.unique_visitors;
  }

  return {
    totalConversations,
    totalMessages,
    resolvedByAi,
    uniqueVisitors,
    resolutionRate:
      totalConversations > 0 ? resolvedByAi / totalConversations : 0,
    daily: Array.from(byDate.values()),
  };
}

export interface AdminPlatformSummary {
  totalOrganizations: number;
  totalConversationsThisMonth: number;
  totalMessagesThisMonth: number;
  leaderboard: {
    organizationId: string;
    name: string;
    conversations: number;
  }[];
}

export async function getAdminPlatformSummary(
  supabase: SupabaseServerClient,
): Promise<AdminPlatformSummary> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const since = monthStart.toISOString().slice(0, 10);

  const { count: totalOrganizations } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true });

  const { data: rows } = await supabase
    .from("agent_daily_analytics")
    .select(
      "organization_id, total_conversations, total_messages, organizations(name)",
    )
    .gte("date", since);

  let totalConversationsThisMonth = 0;
  let totalMessagesThisMonth = 0;
  const perOrg = new Map<string, { name: string; conversations: number }>();

  for (const row of rows ?? []) {
    totalConversationsThisMonth += row.total_conversations;
    totalMessagesThisMonth += row.total_messages;

    const orgRecord = row.organizations as unknown as { name: string } | null;
    const existing = perOrg.get(row.organization_id);
    if (existing) {
      existing.conversations += row.total_conversations;
    } else {
      perOrg.set(row.organization_id, {
        name: orgRecord?.name ?? "Unknown",
        conversations: row.total_conversations,
      });
    }
  }

  const leaderboard = Array.from(perOrg.entries())
    .map(([organizationId, v]) => ({ organizationId, ...v }))
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 10);

  return {
    totalOrganizations: totalOrganizations ?? 0,
    totalConversationsThisMonth,
    totalMessagesThisMonth,
    leaderboard,
  };
}
