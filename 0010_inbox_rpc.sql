-- 0010_inbox_rpc.sql
-- Prompt 05 — Human Handoff: Live Inbox & Takeover

-- ============================================================
-- get_inbox_conversations
--
-- Returns one row per conversation for an organization, along with
-- its most recent message and a "user_streak" count (how many
-- consecutive user messages have arrived since the last assistant
-- reply — used by the "needs attention" heuristic in
-- lib/inbox/queries.ts, kept simple/adjustable per Section 3.2).
--
-- NOT security definer — runs as the calling role, so the existing
-- RLS policies on `conversations` and `messages` (Prompt 01/02) apply
-- exactly as if this were a plain SELECT. This is what keeps a
-- reseller-scoped or single-org caller from seeing another org's rows
-- through this RPC, without needing a redundant org_id check inside
-- the function body.
-- ============================================================

create or replace function get_inbox_conversations(
  target_organization_id uuid,
  channel_filter text default null,
  status_filter text default null
)
returns table (
  id uuid,
  channel text,
  channel_thread_id text,
  visitor_id text,
  visitor_display_name text,
  status text,
  assigned_user_id uuid,
  started_at timestamptz,
  last_message_at timestamptz,
  last_message_content text,
  last_message_role text,
  user_streak int
)
language sql stable
as $$
  select
    c.id,
    c.channel,
    c.channel_thread_id,
    c.visitor_id,
    c.visitor_display_name,
    c.status,
    c.assigned_user_id,
    c.started_at,
    c.last_message_at,
    lm.content as last_message_content,
    lm.role as last_message_role,
    coalesce(streak.user_streak, 0) as user_streak
  from conversations c
  left join lateral (
    select m.content, m.role
    from messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*)::int as user_streak
    from messages m3
    where m3.conversation_id = c.id
      and m3.role = 'user'
      and m3.created_at > coalesce(
        (select max(m4.created_at) from messages m4
         where m4.conversation_id = c.id and m4.role = 'assistant'),
        '-infinity'::timestamptz
      )
  ) streak on true
  where c.organization_id = target_organization_id
    and (channel_filter is null or c.channel = channel_filter)
    and (status_filter is null or c.status = status_filter)
  order by c.last_message_at desc
  limit 100;
$$;

grant execute on function get_inbox_conversations(uuid, text, text)
  to authenticated;