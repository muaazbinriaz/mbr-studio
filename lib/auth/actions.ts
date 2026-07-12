"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE, getCurrentOrg } from "@/lib/auth/current-org";

/**
 * Shared sign-out action. Used as a form action from a button, e.g.:
 *
 *   <form action={signOut}>
 *     <button type="submit">Log out</button>
 *   </form>
 *
 * This will be wired into the admin/client sidebar shells next.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Resolves the current user's id, or throws if unauthenticated.
 * Shared across dashboard action files that previously redefined
 * this locally (e.g. inbox/actions.ts).
 */
export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * Resolves the current user's organization id via their
 * organization_members row. Shared across every dashboard action
 * file that previously redefined this locally.
 */
export async function getCurrentOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const orgResult = await getCurrentOrg(supabase, user.id);
  return orgResult?.active.organizationId ?? null;
}

/**
 * Resolves the current user's org's active agent. Composed from
 * getCurrentOrgId() — same shape onboarding/actions.ts already used.
 */
export async function getActiveAgentForCurrentUser() {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) return null;

  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, organization_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return agent;
}

/**
 * Gate for every admin-only server action. Checks the `admins` table
 * (never trusts client-supplied role claims). Shared across every
 * app/(platform-admin)/admin/** actions.ts file — each one MUST call
 * this before doing anything, even if RLS also happens to protect the
 * underlying table, since RLS gaps (e.g. a table's policy allowing org
 * members too) must not become silent privilege escalations.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, error: "Not authenticated." } as const;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) return { userId: null, error: "Not authorized." } as const;
  return { userId: user.id, error: null } as const;
}

/**
 * Switches the caller's active organization. Verifies membership before
 * trusting the id — never set the cookie to an org the user doesn't
 * actually belong to.
 */
export async function switchActiveOrg(organizationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!membership) {
    return { error: "You don't have access to that organization." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}
