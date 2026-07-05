-- 0013_webhook_delivery_tracking.sql
-- Prompt 07 — Public API & Webhooks

alter table webhook_events
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_attempts int not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_error text;

create index if not exists idx_webhook_events_undelivered
  on webhook_events (organization_id, created_at)
  where delivered_at is null;

alter table api_keys
  add column if not exists key_prefix text,
  add column if not exists last_used_at timestamptz;

-- No RLS changes needed — api_keys and webhook_endpoints already use
-- is_org_accessible() from migration 0012.