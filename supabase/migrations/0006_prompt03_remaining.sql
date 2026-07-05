-- 0006_prompt03_remaining.sql

-- ============================================================
-- Lead capture
-- ============================================================

-- Prevents the widget from prompting for lead capture on every single
-- fallback reply within the same conversation — once shown, stays
-- shown for that conversation.
alter table conversations
  add column if not exists lead_capture_shown boolean not null default false;

-- Per-agent config for which fields the widget's lead capture form
-- asks for. Lives on agent_guardrails since it's a per-agent behavior
-- setting, same table as capture_leads itself.
alter table agent_guardrails
  add column if not exists lead_capture_settings jsonb not null default
    '{"ask_name": true, "ask_email": true, "ask_phone": false, "ask_message": false}'::jsonb;

-- ============================================================
-- Industry templates
-- ============================================================

alter table agents
  add column if not exists greeting_chips text[] not null default '{}';

-- ============================================================
-- Domain verification
-- ============================================================

alter table organizations add column if not exists domain_verify_token text;
alter table organizations add column if not exists domain_verify_status text not null default 'pending';
alter table organizations add column if not exists domain_verified_at timestamptz;
alter table organizations add column if not exists domain_grace_started_at timestamptz;
alter table organizations add column if not exists primary_domain text;

-- No new RLS policies needed for any of the above — every touched
-- column lives on a table (conversations, agent_guardrails, agents,
-- organizations) that already has RLS from Prompt 01/02.