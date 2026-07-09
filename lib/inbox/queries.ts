import type { createClient } from "@/lib/supabase/server";
import { isFallbackReply } from "@/lib/chat/lead-capture";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ConversationStatus =
  | "ai_handling"
  | "human_handling"
  | "resolved"
  | "archived";

export interface InboxConversationRow {
  id: string;
  channel: string;
  channelThreadId: string | null;
  visitorId: string;
  visitorLabel: string;
  status: ConversationStatus;
  assignedUserId: string | null;
  startedAt: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageRole: string | null;
  /**
   * "Needs attention" heuristic (Section 3.2) — deliberately simple and
   * adjustable, not a scoring model:
   *   - the AI is still handling the conversation, AND
   *   - EITHER its last reply matched a lead-capture fallback pattern
   *     (see lib/chat/lead-capture.ts's isFallbackReply — reused here
   *     rather than duplicating the pattern list)
   *   - OR the visitor has sent 2+ messages in a row since the AI's
   *     last reply (the AI is silent/stuck, or hasn't kept up)
   */
  needsAttention: boolean;
  isUnread: boolean;
}

export interface InboxFilters {
  channel?: string;
  status?: ConversationStatus;
  needsAttentionOnly?: boolean;
}

interface InboxRpcRow {
  id: string;
  channel: string;
  channel_thread_id: string | null;
  visitor_id: string;
  visitor_display_name: string | null;
  status: ConversationStatus;
  assigned_user_id: string | null;
  started_at: string;
  last_message_at: string;
  last_message_content: string | null;
  last_message_role: string | null;
  user_streak: number;
}

function computeNeedsAttention(row: InboxRpcRow): boolean {
  if (row.status !== "ai_handling") return false;

  const fallbackTriggered =
    row.last_message_role === "assistant" &&
    !!row.last_message_content &&
    isFallbackReply(row.last_message_content);

  const stuckOnVisitor = row.user_streak >= 2;

  return fallbackTriggered || stuckOnVisitor;
}

export async function getInboxConversations(
  supabase: SupabaseServerClient,
  organizationId: string,
  filters: InboxFilters = {},
): Promise<InboxConversationRow[]> {
  const { data, error } = await supabase.rpc("get_inbox_conversations", {
    target_organization_id: organizationId,
    channel_filter: filters.channel ?? null,
    status_filter: filters.status ?? null,
  });

  if (error) {
    console.error("[inbox] getInboxConversations failed:", error);
    return [];
  }

  const rows = (data ?? []) as InboxRpcRow[];

  // last_seen_at drives the unread indicator — fetched once, applied
  // per row in JS rather than a second round trip per conversation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lastSeenAt: string | null = null;
  if (user) {
    const { data: seenRow } = await supabase
      .from("inbox_last_seen")
      .select("last_seen_at")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    lastSeenAt = seenRow?.last_seen_at ?? null;
  }

  const results: InboxConversationRow[] = rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    channelThreadId: row.channel_thread_id,
    visitorId: row.visitor_id,
    visitorLabel: row.visitor_display_name || row.visitor_id,
    status: row.status,
    assignedUserId: row.assigned_user_id,
    startedAt: row.started_at,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_content,
    lastMessageRole: row.last_message_role,
    needsAttention: computeNeedsAttention(row),
    isUnread: lastSeenAt
      ? new Date(row.last_message_at) > new Date(lastSeenAt)
      : true,
  }));

  if (filters.needsAttentionOnly) {
    return results.filter((r) => r.needsAttention);
  }

  return results;
}

export interface InboxMessageRow {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

/**
 * Unread badge count (Section 5) — granularity is per user, per
 * organization (see migration 0009's comment). Counts conversations
 * whose last activity is newer than the user's last-seen timestamp
 * for this org. A user who has never opened the inbox sees every
 * non-resolved conversation as unread.
 */
export async function getUnreadInboxCount(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: seenRow } = await supabase
    .from("inbox_last_seen")
    .select("last_seen_at")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  let query = supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .neq("status", "resolved")
    .neq("status", "archived");

  if (seenRow?.last_seen_at) {
    query = query.gt("last_message_at", seenRow.last_seen_at);
  }

  const { count } = await query;
  return count ?? 0;
}
