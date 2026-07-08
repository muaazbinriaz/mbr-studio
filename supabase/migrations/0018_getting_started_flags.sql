-- 0018_getting_started_flags.sql
-- Self-reported "embed code added to my site" flag for the getting-started
-- checklist (Prompt 14, Section 3.2 item 4) — this one genuinely can't be
-- auto-detected, so it's honestly a self-reported checkbox.
alter table agents
  add column embed_added_self_reported boolean not null default false;