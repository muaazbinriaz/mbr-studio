-- 0020_admin_only_org_columns.sql
-- Phase 2b — DB-level defense in depth for reseller + billing columns
-- on `organizations`. The existing "for all" policy (is_org_accessible)
-- lets any org member update these columns via the row-level policy;
-- application code already guards this (requireAdmin() in
-- admin/organizations/actions.ts and admin/billing/actions.ts), but a
-- direct table write from any other code path would still slip through.
-- This trigger closes that gap at the database level.

create or replace function public.enforce_admin_only_org_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.is_reseller is distinct from old.is_reseller
       or new.reseller_brand_name is distinct from old.reseller_brand_name
       or new.reseller_logo_url is distinct from old.reseller_logo_url
       or new.reseller_domain is distinct from old.reseller_domain
       or new.plan is distinct from old.plan
       or new.status is distinct from old.status
       or new.monthly_message_limit is distinct from old.monthly_message_limit
    then
      raise exception 'Only admins can modify reseller or billing fields on organizations.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_admin_only_org_columns on organizations;

create trigger trg_enforce_admin_only_org_columns
before update on organizations
for each row
execute function public.enforce_admin_only_org_columns();