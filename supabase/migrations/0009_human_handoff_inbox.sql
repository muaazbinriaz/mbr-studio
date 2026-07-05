-- 0009_human_handoff_inbox.sql
-- Prompt 05 — Human Handoff: Live Inbox & Takeover

-- ============================================================
-- Unread tracking (Section 5 — notifications)
--
-- Granularity chosen: per user, per organization (NOT per
-- conversation). Simpler for MVP — the inbox sidebar badge shows
-- "you have unread activity in this org since you last opened the
-- inbox," not a per-conversation read receipt system. Revisit if a
-- future prompt needs per-conversation granularity.
-- ============================================================

create table inbox_last_seen (
  user_id           uuid not null references auth.users(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  last_seen_at      timestamptz not null default now(),
  primary key (user_id, organization_id)
);

alter table inbox_last_seen enable row level security;

create policy "users manage their own last-seen rows"
on inbox_last_seen for all
using ( user_id = auth.uid() or public.is_admin() )
with check ( user_id = auth.uid() or public.is_admin() );

-- ============================================================
-- Realtime enablement (Section 2)
--
-- RLS already applies to Realtime subscriptions automatically once a
-- table is added to the supabase_realtime publication — a client
-- subscribing to "messages where organization_id = X" still can't
-- receive rows their RLS policy wouldn't otherwise let them select.
-- No new policies needed here; the existing Prompt 01/02 policies on
-- these two tables already cover it.
-- ============================================================

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- ============================================================
-- Helpful index for the inbox list (Section 3.1 — most-recent-first)
-- conversations already has an index on agent_id; this adds one for
-- the org-wide, last-activity-sorted inbox query.
-- ============================================================

create index if not exists idx_conversations_org_last_message
  on conversations (organization_id, last_message_at desc);