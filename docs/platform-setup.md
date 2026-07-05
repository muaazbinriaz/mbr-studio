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

---

## Prompt 04 — Omnichannel (WhatsApp, Instagram, Messenger) Setup

### What was built

- `channel_connections` extended with `phone_number_id`, `webhook_verify_token`,
  `linked_agent_id`, and a unique `(agent_id, channel)` constraint.
- Access tokens encrypted at rest via AES-256-GCM
  (`lib/channels/encryption.ts`, key in `CHANNEL_TOKEN_ENCRYPTION_KEY`).
- One unified inbound webhook (`app/api/channels/webhook/route.ts`) handling
  WhatsApp, Messenger, and Instagram, normalized via
  `lib/channels/parse-inbound.ts`.
- Outbound sending via `lib/channels/send.ts` (one function per channel,
  with retry).
- Inbound messages flow through the same KB retrieval + guardrails +
  `buildSystemPrompt()` pipeline used by the website widget
  (`lib/channels/process-inbound-message.ts`), keeping one consistent
  AI agent across every channel.
- Dashboard UI at `/dashboard/channels` to connect/disconnect each
  channel and send a test WhatsApp message.

### Meta App setup steps (in the order that actually worked)

1. Create a Meta Developer App at developers.facebook.com/apps
   (type: Business), and add the WhatsApp product.
2. Note the App ID and App Secret from **App Settings → Basic**.
3. From **WhatsApp → API Setup**, get the test Phone Number ID and a
   temporary access token (or generate a permanent one via a System
   User in Business Settings, with `whatsapp_business_management` +
   `whatsapp_business_messaging` permissions).
4. **Critical, easy-to-miss step**: subscribing the app to the webhook
   fields in the dashboard is NOT enough on its own. The app must also
   be explicitly subscribed to the specific WABA:
   ```
   POST https://graph.facebook.com/v21.0/{waba-id}/subscribed_apps
   Authorization: Bearer {access-token-with-whatsapp_business_management}
   ```
   Verify with a GET on the same endpoint — expect `{"success": true}`.
   Without this step, webhook configuration can show as verified in
   the dashboard, but real messages will never trigger the webhook.
5. Configure the webhook (**WhatsApp → Configuration**):
   - Callback URL: `https://<your-domain>/api/channels/webhook`
   - Verify Token: matches `META_WEBHOOK_VERIFY_TOKEN` in your env
   - Subscribe to the `messages` field (it is NOT subscribed by
     default — only `account_alerts` is).
6. Connect the channel from `/dashboard/channels` in the app itself
   (WABA ID, Phone Number ID, access token) — this is what actually
   populates `channel_connections` with an encrypted token.

### Known real-world gotcha: phone number verification

A WhatsApp Business phone number has its own `code_verification_status`
independent of the WABA/app setup. Check it via:

```
GET https://graph.facebook.com/v25.0/{waba-id}/phone_numbers
```

If `code_verification_status` is `NOT_VERIFIED`, live customer-sent
messages will never reach your webhook even if everything else
(signature verification, webhook subscription, `subscribed_apps`) is
confirmed correct — Meta's synthetic "Test" event from the dashboard
will still succeed in this state, which can be misleading. Verifying
the number requires:

```
POST https://graph.facebook.com/v25.0/{phone-number-id}/request_code
  ?code_method=SMS&language=en_US
```

then submitting the received code via `verify_code`. This endpoint can
intermittently fail with error code `136024` ("servers temporarily
unavailable") for reasons outside developer control — if this persists
for multiple hours, it may indicate an app-review/Business Verification
gap rather than a transient outage; consider using Meta's default test
number (which does not require this verification) to validate the full
pipeline while resolving business number verification separately.

### Embeddings note (affects this and Prompts 02/03 too)

The knowledge base embedding pipeline was migrated from a local
`@xenova/transformers` model to Google's Gemini embeddings API
(`gemini-embedding-001`, `outputDimensionality: 768`) because the
former's native binary dependencies don't run in Vercel's serverless
runtime. Requires `GOOGLE_AI_API_KEY` in the environment. See
`lib/knowledge-base/embed.ts`.

```

---
```

---

## Prompt 06 — White-Label Reseller Mode

### Making a test org a reseller

1. Go to `/admin/organizations`, click "Manage" on the org you want to make a reseller.
2. Click "Enable reseller mode."
3. Optionally fill in brand name / logo URL / custom domain and click "Save branding."

### Adding a sub-client as that reseller

1. Log in as a user who is a member of the reseller org.
2. Go to `/dashboard/clients` (only visible when your org has reseller mode on).
3. Add a client — this creates a new organization with `parent_organization_id`
   set to your reseller org, a default agent, and an embed key. You become
   `owner` of the new sub-client org automatically.

### Verifying RLS scoping (Section 5, item 1)

Run as three different logged-in test users, or check directly in SQL:

```sql
-- Reseller A's sub-client should NOT be visible to Reseller B's members
select * from organizations
where parent_organization_id = '<reseller-A-org-id>';
-- run this as a user who is only a member of reseller B's org — should
-- return 0 rows.

-- A direct MBR Studio client (no parent) should never be visible to
-- any reseller
select * from organizations where id = '<direct-client-org-id>';
-- run as a reseller-org member who is NOT also a direct member — 0 rows.

-- An admin should still see everything
select count(*) from organizations;
-- run as a user in the `admins` table — should return the full count.
```

### Known limitation

`/dashboard/clients/[id]` currently shows summary stats only. Full
knowledge-base/guardrails/inbox editing per sub-client (reusing the
existing dashboard components scoped by an org-id param instead of the
current user's own membership) is a follow-up routing change — the
RLS/security model already supports it fully via `is_org_accessible()`.

### Handoff to Prompt 07

`api_keys` and `webhook_endpoints` RLS policies were updated in
migration `0012_reseller_branding.sql` to use `is_org_accessible()`,
so they already work correctly for reseller sub-organizations —
Prompt 07 can build directly on this without re-checking.

---

## Prompt 06 — White-Label Reseller Mode

### Making a test org a reseller

1. Go to `/admin/organizations`, click "Manage" on the org you want to make a reseller.
2. Click "Enable reseller mode."
3. Optionally fill in brand name / logo URL / custom domain and click "Save branding."

### Adding a sub-client as that reseller

1. Log in as a user who is a member of the reseller org.
2. Go to `/dashboard/clients` (only visible when your org has reseller mode on).
3. Add a client — this creates a new organization with `parent_organization_id`
   set to your reseller org, a default agent, and an embed key. You become
   `owner` of the new sub-client org automatically.

### Verifying RLS scoping (Section 5, item 1)

Run as three different logged-in test users, or check directly in SQL:

```sql
-- Reseller A's sub-client should NOT be visible to Reseller B's members
select * from organizations
where parent_organization_id = '<reseller-A-org-id>';
-- run this as a user who is only a member of reseller B's org — should
-- return 0 rows.

-- A direct MBR Studio client (no parent) should never be visible to
-- any reseller
select * from organizations where id = '<direct-client-org-id>';
-- run as a reseller-org member who is NOT also a direct member — 0 rows.

-- An admin should still see everything
select count(*) from organizations;
-- run as a user in the `admins` table — should return the full count.
```

### Known limitation

`/dashboard/clients/[id]` currently shows summary stats only. Full
knowledge-base/guardrails/inbox editing per sub-client (reusing the
existing dashboard components scoped by an org-id param instead of the
current user's own membership) is a follow-up routing change — the
RLS/security model already supports it fully via `is_org_accessible()`.

### White-label branding surfaces

- Login/signup page (`/login`, `/signup`): looks up `reseller_domain`
  against the request's `host` header and swaps the brand name/logo if
  a matching reseller org is found. Requires the reseller's custom
  domain to actually point at this deployment — out of scope here.
- Widget "Powered by" footer: resolves via the served org's
  `parent_organization_id` at request time in `/api/widget/config`, so
  it always reflects current branding without a rebuild.
- Both explicitly no-op for organizations with no `parent_organization_id`
  — direct MBR Studio clients are unaffected.

### Handoff to Prompt 07

`api_keys` and `webhook_endpoints` RLS policies were updated in
migration `0012_reseller_branding.sql` to use `is_org_accessible()`,
so they already work correctly for reseller sub-organizations —
Prompt 07 can build directly on this without re-checking.

# Manual Billing (Pakistan-first) — Addendum to docs/platform-setup.md

Built ahead of Prompt 08's Stripe flow because Stripe can't pay out to a
Pakistani bank account without a foreign entity, and most local clients
pay via bank transfer / JazzCash / Easypaisa rather than an international
card. This does NOT touch the enforcement logic in
`app/api/widget/chat/route.ts` or `app/api/channels/webhook/route.ts` —
both already read `organizations.plan` / `status` / `monthly_message_limit`
and don't care how those columns got set.

## 1. Run the migration

```
supabase/migrations/0014_manual_billing.sql
```

## 2. Fill in real payment details

Edit `lib/billing/plans.ts`:

- `MANUAL_PAYMENT_METHODS[].instructions` — replace the `[TODO]` bank/JazzCash/Easypaisa details with your real ones.
- `PLANS.*.priceMonthlyPKR` — confirm against real client conversations before treating as final.

## 3. Wire up navigation

In `components/platform/PlatformShell.tsx`:

- Client nav (`NAV_ITEMS_BY_VARIANT.client`): add `{ label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard }` (import `CreditCard` from lucide-react).
- Admin nav (`NAV_ITEMS_BY_VARIANT.admin`): add `{ label: "Billing", href: "/admin/billing", icon: CreditCard }`.

## 4. (Optional but recommended) Gate channels by plan

In `app/(platform-client)/dashboard/channels/actions.ts`, at the top of
`connectWhatsApp` / `connectMessenger` / `connectInstagram`, after
resolving `agent`:

````ts
const { data: org } = await supabase
  .from("organizations")
  .select("plan")
  .eq("id", agent.organization_id)
  .maybeSingle();

if (!isChannelAllowedForPlan(org?.plan ?? "starter", "whatsapp")) {
  return { error: "Your current plan doesn't include this channel — upgrade from Settings > Billing." };
}
```//
(swap `"whatsapp"` for the matching channel per function). Import
`isChannelAllowedForPlan` from `@/lib/billing/limits`.

## 5. Test the full cycle

1. Sign up a fresh test account — org starts as `plan: 'starter'`, `status: 'trial'`.
2. Go to `/dashboard/settings/billing`, pick a plan, choose a payment method, enter any reference text, submit.
3. Log in as an admin, go to `/admin/billing` — the request appears under Pending.
4. Click "Approve & activate" — confirm in SQL:
   ```sql
   select plan, status, monthly_message_limit from organizations where id = '<org id>';
   select * from subscriptions where organization_id = '<org id>';
   select status from billing_requests where organization_id = '<org id>';
````

`status` should be `active`, `monthly_message_limit` should match the approved plan, and the `billing_requests` row should show `approved`. 5. Try submitting a second request while one is still pending — should be blocked client-side with a clear message. 6. Test reject: submit another request, reject it from `/admin/billing`, confirm `organizations` is untouched and the client sees no pending banner anymore (can resubmit).

## Known scope limits (by design, for now)

- No automated renewal reminders — `subscriptions.current_period_end` is set on approval but nothing currently checks it. Add a cron job later if you want auto-expiry/renewal nudges.
- `maxAgents` gating isn't wired in — the current codebase always creates exactly one agent per organization at signup/client-creation time, so there's no "add another agent to the same org" flow yet to gate.
- This flow and a future Stripe flow (Prompt 08) can coexist: Stripe's webhook would just be another writer to the same three `organizations` columns, for clients who _can_ pay via card.
