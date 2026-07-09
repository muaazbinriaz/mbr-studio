-- 0021_pin_billing_request_status.sql
-- SECURITY FIX (audit finding L3): insert policy pehle sirf org
-- ownership check karti thi, status field ko pin nahi karti thi.
-- Isliye koi client server action bypass karke direct PostgREST
-- insert se status: 'approved' set kar sakta tha.

drop policy "org members can submit billing requests" on billing_requests;

create policy "org members can submit billing requests"
on billing_requests for insert
with check (
  public.is_org_accessible(organization_id)
  and status = 'pending'
);