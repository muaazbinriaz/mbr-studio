-- ============================================================
-- 0001_platform_core.sql
-- Multi-tenant AI Chatbot SaaS Platform — Core Schema
-- ============================================================

create extension if not exists vector;

-- ============================================================
-- 3.1 Tenancy & reseller hierarchy
-- ============================================================

create table organizations (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  slug                    text unique not null,
  parent_organization_id  uuid references organizations(id),
  is_reseller             boolean not null default false,
  status                  text not null default 'trial',
  plan                    text not null default 'starter',
  primary_color           text not null default '#6366f1',
  accent_color            text not null default '#06b6d4',
  logo_url                text,
  welcome_message         text not null default 'Hi! How can I help you today?',
  widget_position         text not null default 'bottom-right',
  allowed_domains         text[] not null default '{}',
  monthly_message_limit   integer not null default 500,
  timezone                text not null default 'Asia/Karachi',
  created_at              timestamptz not null default now()
);

create table organization_members (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              text not null default 'owner',
  invited_email     text,
  created_at        timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 3.2 Agents
-- ============================================================

create table agents (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  name               text not null,
  agent_type         text not null default 'general',
  system_prompt      text,
  is_active          boolean not null default true,
  setup_complete     boolean not null default false,
  ai_provider        text not null default 'openrouter',
  preferred_model    text,
  client_api_key     text,
  created_at         timestamptz not null default now()
);

-- ============================================================
-- 3.3 Knowledge base
-- ============================================================

create table knowledge_base_documents (
  id                uuid primary key default gen_random_uuid(),
  agent_id          uuid not null references agents(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  source_type       text not null,
  title             text not null,
  raw_content       text,
  source_url        text,
  status            text not null default 'processing',
  created_at        timestamptz not null default now()
);

create table knowledge_base_chunks (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references knowledge_base_documents(id) on delete cascade,
  agent_id          uuid not null references agents(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  content           text not null,
  embedding         vector(1536),
  created_at        timestamptz not null default now()
);

-- ============================================================
-- 3.4 Conversations & messages
-- ============================================================

create table conversations (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid not null references agents(id) on delete cascade,
  organization_id       uuid not null references organizations(id) on delete cascade,
  channel               text not null default 'website',
  channel_thread_id     text,
  visitor_id            text not null,
  visitor_display_name  text,
  visitor_page_url      text,
  status                text not null default 'ai_handling',
  assigned_user_id      uuid references auth.users(id),
  started_at            timestamptz not null default now(),
  last_message_at       timestamptz not null default now()
);

create index idx_conversations_channel_thread on conversations(channel_thread_id);
create index idx_conversations_agent on conversations(agent_id);

create table messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  agent_id          uuid not null references agents(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  role              text not null,
  content           text not null,
  created_at        timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id);

-- ============================================================
-- 3.5 Embed & channel credentials
-- ============================================================

create table embed_keys (
  id                uuid primary key default gen_random_uuid(),
  agent_id          uuid not null references agents(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  public_key        text unique not null,
  created_at        timestamptz not null default now(),
  revoked_at        timestamptz
);

create table channel_connections (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid not null references agents(id) on delete cascade,
  organization_id       uuid not null references organizations(id) on delete cascade,
  channel               text not null,
  external_account_id   text,
  access_token          text,
  status                text not null default 'disconnected',
  created_at            timestamptz not null default now()
);

-- ============================================================
-- 3.6 Leads, analytics, guardrails
-- ============================================================

create table leads (
  id                uuid primary key default gen_random_uuid(),
  agent_id          uuid not null references agents(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  conversation_id   uuid references conversations(id),
  visitor_name      text,
  visitor_email     text,
  visitor_phone     text,
  notes             text,
  captured_at       timestamptz not null default now()
);

create table agent_daily_analytics (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid not null references agents(id) on delete cascade,
  organization_id       uuid not null references organizations(id) on delete cascade,
  date                  date not null,
  channel               text not null default 'all',
  total_conversations   integer not null default 0,
  total_messages        integer not null default 0,
  resolved_by_ai        integer not null default 0,
  unique_visitors       integer not null default 0,
  unique (agent_id, date, channel)
);

create table agent_guardrails (
  agent_id              uuid primary key references agents(id) on delete cascade,
  no_competitors        boolean not null default false,
  stay_on_topic         boolean not null default true,
  no_pricing            boolean not null default false,
  always_polite         boolean not null default true,
  no_opinions           boolean not null default false,
  push_contact          boolean not null default false,
  no_refund_promise     boolean not null default false,
  capture_leads         boolean not null default true,
  custom_rules          text,
  tone                  text not null default 'professional',
  reply_language        text not null default 'auto'
);

-- ============================================================
-- 3.7 Webhooks & public API
-- ============================================================

create table webhook_endpoints (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  target_url          text not null,
  secret              text not null,
  subscribed_events   text[] not null default '{}',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table webhook_events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  event_type        text not null,
  payload           jsonb not null,
  created_at        timestamptz not null default now()
);

create table api_keys (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  key_hash          text not null,
  label             text,
  created_at        timestamptz not null default now(),
  revoked_at        timestamptz
);

-- ============================================================
-- 3.8 Billing
-- ============================================================

create table subscriptions (
  organization_id          uuid primary key references organizations(id) on delete cascade,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  current_period_end       timestamptz,
  created_at               timestamptz not null default now()
);