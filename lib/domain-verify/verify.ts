import { resolveTxt } from "dns/promises";
import { createAdminClient } from "@/lib/supabase/admin";

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Plain function so it's callable from the manual "Check now" dashboard
 * action AND from the GET route below (which a Vercel Cron job can hit
 * on a schedule later) — no logic duplicated between the two call paths.
 *
 * Grace logic: status only ever stays 'verified', 'pending', or flips
 * to 'suspended' — grace itself is tracked purely via
 * domain_grace_started_at, set once on the first failed check after
 * being verified, and cleared the moment verification succeeds again.
 * It is NEVER reset on repeated failures — that's what stops a
 * flaky/slow DNS provider from perpetually extending the grace window.
 */
export async function verifyOrganizationDomain(organizationId: string) {
  const supabase = createAdminClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select(
      "id, primary_domain, domain_verify_token, domain_verify_status, domain_grace_started_at",
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !org) {
    return { error: "Organization not found." };
  }

  if (!org.primary_domain || !org.domain_verify_token) {
    return { error: "No domain or verification token set up yet." };
  }

  const recordName = `_mbrstudio-verify.${org.primary_domain}`;
  const expectedValue = `mbrstudio-verify=${org.domain_verify_token}`;

  let found = false;
  try {
    const records = await resolveTxt(recordName);
    found = records.some((chunks) => chunks.join("").trim() === expectedValue);
  } catch {
    found = false; // NXDOMAIN / no records — normal during setup, not an error
  }

  if (found) {
    await supabase
      .from("organizations")
      .update({
        domain_verify_status: "verified",
        domain_verified_at: new Date().toISOString(),
        domain_grace_started_at: null,
      })
      .eq("id", organizationId);
    return { status: "verified" as const, inGrace: false };
  }

  if (org.domain_verify_status === "verified") {
    const graceStartedAt = org.domain_grace_started_at
      ? new Date(org.domain_grace_started_at)
      : new Date();
    const isNewGracePeriod = !org.domain_grace_started_at;
    const graceExpired =
      Date.now() - graceStartedAt.getTime() > GRACE_PERIOD_MS;

    if (graceExpired) {
      await supabase
        .from("organizations")
        .update({ domain_verify_status: "suspended" })
        .eq("id", organizationId);
      return { status: "suspended" as const, inGrace: false };
    }

    await supabase
      .from("organizations")
      .update({
        domain_grace_started_at: isNewGracePeriod
          ? graceStartedAt.toISOString()
          : org.domain_grace_started_at,
      })
      .eq("id", organizationId);
    return { status: "verified" as const, inGrace: true };
  }

  if (org.domain_verify_status === "suspended") {
    return { status: "suspended" as const, inGrace: false };
  }

  await supabase
    .from("organizations")
    .update({ domain_verify_status: "pending" })
    .eq("id", organizationId);
  return { status: "pending" as const, inGrace: false };
}
