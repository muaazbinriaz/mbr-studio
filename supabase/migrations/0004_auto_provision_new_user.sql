-- 0004_auto_provision_new_user.sql
-- FIX: signup/page.tsx only calls supabase.auth.signUp() and never creates
-- an organization/membership/agent — meaning every real signup currently
-- lands on a dashboard with "No active agent found," permanently, with no
-- way to fix it except a manual SQL insert (which is obviously not
-- acceptable for real paying clients).
--
-- This trigger runs automatically, at the database level, the instant a
-- new row is inserted into auth.users — regardless of whether the user
-- signed up via password or magic link, and regardless of any frontend
-- code path. This is the standard, reliable Supabase pattern for
-- "do something when a user signs up."

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
  -- Build a reasonably readable slug from the email's local part,
  -- e.g. "muaazbinriaz2000@gmail.com" -> "muaazbinriaz2000"
  base_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  slug_suffix := substr(md5(random()::text), 1, 6);
  final_slug := base_slug || '-' || slug_suffix; -- suffix avoids collisions if two users share a local-part

  -- 1. Create the organization
  insert into public.organizations (name, slug, welcome_message)
  values (
    initcap(replace(base_slug, '-', ' ')) || '''s Business',
    final_slug,
    'Hi! How can I help you today?'
  )
  returning id into new_org_id;

  -- 2. Make the new user the owner
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- 3. Create a default agent for them to configure
  insert into public.agents (organization_id, name, agent_type)
  values (new_org_id, 'Main Agent', 'general')
  returning id into new_agent_id;

  -- 4. Generate an embed key so the widget is technically embeddable
  --    from the moment they sign up, even before they've customized anything
  insert into public.embed_keys (agent_id, organization_id, public_key)
  values (
    new_agent_id,
    new_org_id,
    'clx_' || replace(gen_random_uuid()::text, '-', '')
  );

  -- 5. Give them sane default guardrails (Prompt 03's table — safe no-op
  --    if this migration runs before Prompt 03's table exists; remove
  --    this block if you're applying this fix before building Prompt 03)
  insert into public.agent_guardrails (agent_id)
  values (new_agent_id)
  on conflict (agent_id) do nothing;

  return new;
end;
$$;

-- Attach the trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();