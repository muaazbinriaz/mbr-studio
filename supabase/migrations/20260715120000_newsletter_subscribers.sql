-- Newsletter capture for the public blog. No paid email platform — this
-- list is stored for later use once the AI SaaS product launches. No
-- emails are sent from the app based on this table yet.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Public blog visitors are anonymous — allow anyone to insert their own
-- subscription, but never allow reading, updating, or deleting from the
-- client. Admin access, if ever needed, goes through createAdminClient()
-- (service role), which bypasses RLS entirely and isn't affected by this.
create policy "Anyone can subscribe to the newsletter"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);