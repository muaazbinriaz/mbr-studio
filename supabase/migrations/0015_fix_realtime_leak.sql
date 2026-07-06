-- 0015_fix_realtime_leak.sql
-- SECURITY FIX: removes anon-role table-wide SELECT access on
-- conversations/messages (was leaking every client's chats), and
-- adds the missing unique constraint that channel_connections'
-- upsert(onConflict: "agent_id,channel") requires to function.

-- Issue A: remove the broken anon SELECT policies from 0011 — these
-- granted table-wide read access to any anonymous caller holding the
-- anon key, not per-conversation access as their comment claimed.
drop policy if exists "anon can read website conversations by known id" on conversations;
drop policy if exists "anon can read website messages for a known conversation id" on messages;

-- NOTE: do NOT remove conversations/messages from the
-- supabase_realtime publication — the authenticated staff inbox still
-- legitimately uses postgres_changes there, scoped by is_org_accessible().
-- Only the anon-role policies above are removed. The widget will use
-- Broadcast instead (no table access needed at all).

-- Issue B: add the missing constraint the upsert() calls need
alter table channel_connections
  add constraint channel_connections_agent_channel_unique
  unique (agent_id, channel);