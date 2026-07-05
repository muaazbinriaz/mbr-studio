-- 0012_reseller_branding.sql
-- Prompt 06 — White-Label Reseller Mode

-- ============================================================
-- Reseller branding columns (only meaningful when is_reseller = true)
-- ============================================================
alter table organizations add column if not exists reseller_brand_name text;
alter table organizations add column if not exists reseller_logo_url text;
alter table organizations add column if not exists reseller_domain text;

-- ============================================================
-- Single source of truth for "can the current user touch this org's
-- data" — member of the org, an admin, OR a member of the org's
-- reseller parent. Every RLS policy below calls this instead of
-- hand-rolling the three-way OR.
-- ============================================================
create or replace function public.is_org_accessible(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_org_member(target_org_id)
    or public.is_admin()
    or target_org_id in (
      select o.id from organizations o
      where o.parent_organization_id is not null
        and public.is_org_member(o.parent_organization_id)
    );
$$;

-- ------------------------------------------------------------
-- organizations
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org" on organizations;
drop policy if exists "reseller members can view their sub-organizations" on organizations;

create policy "org accessible per is_org_accessible"
on organizations for all
using ( public.is_org_accessible(id) )
with check ( public.is_org_accessible(id) );

-- ------------------------------------------------------------
-- organization_members
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's membership rows" on organization_members;

create policy "org_members accessible per is_org_accessible"
on organization_members for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- agents
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's agents" on agents;

create policy "agents accessible per is_org_accessible"
on agents for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- knowledge_base_documents
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's kb documents" on knowledge_base_documents;

create policy "kb_documents accessible per is_org_accessible"
on knowledge_base_documents for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- knowledge_base_chunks
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's kb chunks" on knowledge_base_chunks;

create policy "kb_chunks accessible per is_org_accessible"
on knowledge_base_chunks for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's conversations" on conversations;

create policy "conversations accessible per is_org_accessible"
on conversations for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's messages" on messages;

create policy "messages accessible per is_org_accessible"
on messages for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- embed_keys
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's embed keys" on embed_keys;

create policy "embed_keys accessible per is_org_accessible"
on embed_keys for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- channel_connections
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's channel connections" on channel_connections;

create policy "channel_connections accessible per is_org_accessible"
on channel_connections for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- leads
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's leads" on leads;

create policy "leads accessible per is_org_accessible"
on leads for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- agent_daily_analytics
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's analytics" on agent_daily_analytics;

create policy "analytics accessible per is_org_accessible"
on agent_daily_analytics for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- agent_guardrails (no organization_id column — join via agents)
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's guardrails" on agent_guardrails;

create policy "guardrails accessible per is_org_accessible"
on agent_guardrails for all
using (
  exists (
    select 1 from agents
    where agents.id = agent_guardrails.agent_id
      and public.is_org_accessible(agents.organization_id)
  )
)
with check (
  exists (
    select 1 from agents
    where agents.id = agent_guardrails.agent_id
      and public.is_org_accessible(agents.organization_id)
  )
);

-- ------------------------------------------------------------
-- webhook_endpoints
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's webhook endpoints" on webhook_endpoints;

create policy "webhook_endpoints accessible per is_org_accessible"
on webhook_endpoints for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- webhook_events
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's webhook events" on webhook_events;

create policy "webhook_events accessible per is_org_accessible"
on webhook_events for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- api_keys
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's api keys" on api_keys;

create policy "api_keys accessible per is_org_accessible"
on api_keys for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
drop policy if exists "org members can access their own org's subscription" on subscriptions;

create policy "subscriptions accessible per is_org_accessible"
on subscriptions for all
using ( public.is_org_accessible(organization_id) )
with check ( public.is_org_accessible(organization_id) );

-- inbox_last_seen (Prompt 05) is keyed by user_id, not organization_id
-- — no change needed, it was never org-scoped.