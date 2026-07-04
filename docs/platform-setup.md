# Platform Setup

Setup guide for the multi-tenant AI chatbot platform layered on top of the
MBR Studio marketing site.

## 1. Create a Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Pick a region close to your users
3. Save the database password somewhere safe

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in (Project → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 3. Run migrations

In the Supabase Dashboard → SQL Editor, run in order:

1. `supabase/migrations/0001_platform_core.sql` — all tables + `vector` extension
2. `supabase/migrations/0002_rls_policies.sql` — RLS on every table

Verify:

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;
```

Every table should show `rowsecurity = true`.

## 4. Make your own account an admin

1. Sign up through the app at `/signup` with your real email
2. Confirm the email (Supabase sends a confirmation link by default)
3. In Supabase Dashboard → SQL Editor, find your user id:

   ```sql
   select id, email from auth.users where email = 'you@example.com';
   ```

4. Insert yourself into `admins` using that id:

   ```sql
   insert into admins (user_id) values ('paste-your-uuid-here');
   ```

5. Log out and log back in at `/login` — you should now be able to reach
   `/admin` instead of being redirected to `/dashboard`.

## 5. Create your first test organization

1. Go to `/admin/organizations`
2. Fill in a name, click "Create organization"
3. This creates: an `organizations` row, a default `agents` row, and an
   `embed_keys` row with a `public_key` (shown next to the org in the list)

Copy that `public_key`, the `organization_id`, and `agent_id` — Prompt 02
(Knowledge Base + Website Widget) needs them to build and test the
embeddable widget against a real agent.

To find the ids:

```sql
select o.id as organization_id, a.id as agent_id, e.public_key
from organizations o
join agents a on a.organization_id = o.id
join embed_keys e on e.agent_id = a.id
order by o.created_at desc
limit 1;
```
