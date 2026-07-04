-- ============================================================
-- 0002_rls_policies.sql
-- Row Level Security for every multi-tenant table
-- Run this AFTER 0001_platform_core.sql
-- ============================================================

-- ------------------------------------------------------------
-- Helper functions (SECURITY DEFINER avoids infinite recursion
-- when a table's own policy needs to query organization_members
-- or admins — these run with elevated privilege and bypass RLS
-- on the underlying lookup tables).
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where user_id = auth.uid()
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- admins
-- ------------------------------------------------------------
alter table admins enable row level security;

create policy "admins can view admin list"
on admins for select
using ( public.is_admin() );

-- no insert/update/delete policy on purpose — admins are only ever
-- added via the service-role bootstrap script (Section 7.5), never
-- through a client-facing RLS-governed insert.

-- ------------------------------------------------------------
-- organizations
-- ------------------------------------------------------------
alter table organizations enable row level security;

create policy "org members can access their own org"
on organizations for all
using (
  public.is_org_member(id) or public.is_admin()
)
with check (
  public.is_org_member(id) or public.is_admin()
);

create policy "reseller members can view their sub-organizations"
on organizations for select
using (
  parent_organization_id is not null
  and public.is_org_member(parent_organization_id)
);

-- ------------------------------------------------------------
-- organization_members
-- ------------------------------------------------------------
alter table organization_members enable row level security;

create policy "org members can access their own org's membership rows"
on organization_members for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- agents
-- ------------------------------------------------------------
alter table agents enable row level security;

create policy "org members can access their own org's agents"
on agents for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- knowledge_base_documents
-- ------------------------------------------------------------
alter table knowledge_base_documents enable row level security;

create policy "org members can access their own org's kb documents"
on knowledge_base_documents for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- knowledge_base_chunks
-- ------------------------------------------------------------
alter table knowledge_base_chunks enable row level security;

create policy "org members can access their own org's kb chunks"
on knowledge_base_chunks for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
alter table conversations enable row level security;

create policy "org members can access their own org's conversations"
on conversations for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
alter table messages enable row level security;

create policy "org members can access their own org's messages"
on messages for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- embed_keys
-- ------------------------------------------------------------
alter table embed_keys enable row level security;

create policy "org members can access their own org's embed keys"
on embed_keys for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- channel_connections
-- ------------------------------------------------------------
alter table channel_connections enable row level security;

create policy "org members can access their own org's channel connections"
on channel_connections for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- leads
-- ------------------------------------------------------------
alter table leads enable row level security;

create policy "org members can access their own org's leads"
on leads for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- agent_daily_analytics
-- ------------------------------------------------------------
alter table agent_daily_analytics enable row level security;

create policy "org members can access their own org's analytics"
on agent_daily_analytics for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- agent_guardrails
-- (no organization_id column directly — scope via agents.organization_id)
-- ------------------------------------------------------------
alter table agent_guardrails enable row level security;

create policy "org members can access their own org's guardrails"
on agent_guardrails for all
using (
  public.is_admin() or exists (
    select 1 from agents
    where agents.id = agent_guardrails.agent_id
      and public.is_org_member(agents.organization_id)
  )
)
with check (
  public.is_admin() or exists (
    select 1 from agents
    where agents.id = agent_guardrails.agent_id
      and public.is_org_member(agents.organization_id)
  )
);

-- ------------------------------------------------------------
-- webhook_endpoints
-- ------------------------------------------------------------
alter table webhook_endpoints enable row level security;

create policy "org members can access their own org's webhook endpoints"
on webhook_endpoints for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- webhook_events
-- ------------------------------------------------------------
alter table webhook_events enable row level security;

create policy "org members can access their own org's webhook events"
on webhook_events for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- api_keys
-- ------------------------------------------------------------
alter table api_keys enable row level security;

create policy "org members can access their own org's api keys"
on api_keys for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
alter table subscriptions enable row level security;

create policy "org members can access their own org's subscription"
on subscriptions for all
using (
  public.is_org_member(organization_id) or public.is_admin()
)
with check (
  public.is_org_member(organization_id) or public.is_admin()
);