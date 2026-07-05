-- 0005_agent_daily_visitors.sql
-- Tracks which visitors have already been counted as "unique" for a
-- given agent on a given day, so agent_daily_analytics.unique_visitors
-- can be incremented correctly (once per visitor per day), instead of
-- always sitting at 0 like it currently does.

create table agent_daily_visitors (
  agent_id    uuid not null references agents(id) on delete cascade,
  date        date not null,
  visitor_id  text not null,
  channel     text not null default 'website',
  created_at  timestamptz not null default now(),
  primary key (agent_id, date, visitor_id, channel)
);

alter table agent_daily_visitors enable row level security;

create policy "org members can view their own org's daily visitors"
on agent_daily_visitors for select
using (
  exists (
    select 1 from agents
    where agents.id = agent_daily_visitors.agent_id
      and public.is_org_member(agents.organization_id)
  ) or public.is_admin()
);
-- No insert/update policy needed — only the service-role client
-- (widget chat route) ever writes to this table.