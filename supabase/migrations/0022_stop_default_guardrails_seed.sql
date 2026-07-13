-- 0022_stop_default_guardrails_seed.sql
-- FIX: handle_new_user() was inserting a default agent_guardrails row for
-- every new signup, which made the dashboard's "Set up guardrails and
-- tone" checklist item appear pre-completed for users who never touched
-- it. build-system-prompt.ts already falls back to DEFAULT_GUARDRAILS
-- when no row exists, and saveGuardrails()/applyTemplate() both upsert —
-- so it's safe to stop seeding this row and only create it once the user
-- actually saves guardrails or picks a template.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_agent_id uuid;
  base_slug text;
  final_slug text;
  slug_suffix text;
begin
  base_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  slug_suffix := substr(md5(random()::text), 1, 6);
  final_slug := base_slug || '-' || slug_suffix;

  insert into public.organizations (name, slug, welcome_message)
  values (
    initcap(replace(base_slug, '-', ' ')) || '''s Business',
    final_slug,
    'Hi! How can I help you today?'
  )
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  insert into public.agents (organization_id, name, agent_type)
  values (new_org_id, 'Main Agent', 'general')
  returning id into new_agent_id;

  insert into public.embed_keys (agent_id, organization_id, public_key)
  values (
    new_agent_id,
    new_org_id,
    'clx_' || replace(gen_random_uuid()::text, '-', '')
  );

  -- Step 5 (default agent_guardrails insert) intentionally removed.
  -- The checklist should only mark "guardrails" done once the user
  -- actually visits and saves that page.

  return new;
end;
$$;