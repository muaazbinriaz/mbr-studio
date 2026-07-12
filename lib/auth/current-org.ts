import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export const ACTIVE_ORG_COOKIE = "active_org_id";

export type OrgMembership = {
  organizationId: string;
  role: string;
  organizationName: string;
  isReseller: boolean;
};

/**
 * Resolves which organization the current request should act as, and the
 * full list of orgs this user can switch between (resellers only see >1).
 *
 * Priority:
 *  1. The `active_org_id` cookie, IF the user actually has a membership
 *     row for that org — prevents a stale/tampered cookie from pointing
 *     at an org they no longer belong to.
 *  2. Otherwise, their oldest membership (their own org from signup) —
 *     never a later-created client sub-org.
 */
export async function getCurrentOrg(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ active: OrgMembership; memberships: OrgMembership[] } | null> {
  const { data: rows } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name, is_reseller)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) return null;

  const memberships: OrgMembership[] = rows.map((r) => {
    const org = r.organizations as unknown as {
      name: string;
      is_reseller: boolean;
    } | null;
    return {
      organizationId: r.organization_id as string,
      role: r.role as string,
      organizationName: org?.name ?? "Untitled organization",
      isReseller: org?.is_reseller ?? false,
    };
  });

  const cookieStore = await cookies();
  const activeCookie = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const fromCookie = activeCookie
    ? memberships.find((m) => m.organizationId === activeCookie)
    : undefined;

  return { active: fromCookie ?? memberships[0], memberships };
}
