-- 0014_manual_billing.sql
-- Manual/local billing flow — built first for Pakistan-market clients.
--
-- WHY THIS EXISTS INSTEAD OF STRIPE CHECKOUT:
-- Stripe doesn't pay out to Pakistani bank accounts without a foreign
-- entity, and most local SMB clients pay via bank transfer, JazzCash,
-- or Easypaisa rather than an international card. Rather than block
-- launch on Stripe/entity setup, this table lets a client submit a
-- payment claim (plan + payment method + reference) and an admin
-- approve it — which then sets organizations.plan / status /
-- monthly_message_limit exactly the way a Stripe webhook would in the
-- original design. The widget/channel enforcement logic (Prompt 02/04)
-- needs ZERO changes — it only ever reads those three columns.
--
-- A real Stripe flow can be layered on top later for international
-- clients without touching this table or the columns it writes to.

create table billing_requests (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  plan              text not null,
  billing_period    text not null default 'monthly', -- 'monthly' | 'yearly'
  payment_method    text not null, -- 'bank_transfer' | 'jazzcash' | 'easypaisa'
  payment_reference text,          -- transaction id / last 4 digits / note
  status            text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  requested_by      uuid references auth.users(id),
  requested_at      timestamptz not null default now(),
  reviewed_by       uuid references auth.users(id),
  reviewed_at       timestamptz,
  rejection_reason  text
);

create index idx_billing_requests_status on billing_requests(status, requested_at desc);
create index idx_billing_requests_org on billing_requests(organization_id);

alter table billing_requests enable row level security;

-- Org members (including reseller-parent members, via is_org_accessible
-- from migration 0012) can view and submit their own org's requests.
create policy "org members can view their own billing requests"
on billing_requests for select
using ( public.is_org_accessible(organization_id) );

create policy "org members can submit billing requests"
on billing_requests for insert
with check ( public.is_org_accessible(organization_id) );

-- Only admins can review (approve/reject) — never the org itself,
-- otherwise a client could self-approve their own payment claim.
create policy "admins can review billing requests"
on billing_requests for update
using ( public.is_admin() )
with check ( public.is_admin() );