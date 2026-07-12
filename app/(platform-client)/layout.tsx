import type { Metadata } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { getUnreadInboxCount } from "@/lib/inbox/queries";
import { getCurrentOrg } from "@/lib/auth/current-org";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // middleware.ts already ran auth.getUser() for this exact request and
  // redirects unauthenticated visitors before they ever reach this layout —
  // calling getUser() again here was a fully redundant Supabase round-trip
  // that added to the blocking window before any HTML (theme-init script
  // included) could reach the browser. Read its result from the header
  // middleware sets instead.
  const requestHeaders = await headers();
  const userId = requestHeaders.get("x-user-id") ?? "";
  const userEmail = requestHeaders.get("x-user-email");

  const supabase = await createClient();
  const orgResult = await getCurrentOrg(supabase, userId);
  const membership = orgResult
    ? { organization_id: orgResult.active.organizationId }
    : null;

  const unreadCount = membership
    ? await getUnreadInboxCount(supabase, membership.organization_id)
    : 0;

  let setupComplete = true;
  let agentName = "Your Agent";
  let agentStatus: "live" | "trial" | "paused" = "live";

  if (membership) {
    const { data: agent } = await supabase
      .from("agents")
      .select("setup_complete, agent_name, is_active")
      .eq("organization_id", membership.organization_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    // No agent row yet (mid-provisioning) is treated as "not complete" —
    // safer default than briefly flashing the full sidebar.
    setupComplete = agent?.setup_complete ?? false;

    if (agent?.agent_name) agentName = agent.agent_name;

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("status")
      .eq("id", membership.organization_id)
      .maybeSingle();

    agentStatus = !agent?.is_active
      ? "paused"
      : orgRow?.status === "trial"
        ? "trial"
        : "live";
  }

  return (
    <PlatformShell
      variant="client"
      userEmail={userEmail}
      navBadges={{ "/dashboard/inbox": unreadCount }}
      isReseller={!!orgResult?.active.isReseller}
      setupComplete={setupComplete}
      agentName={agentName}
      agentStatus={agentStatus}
      memberships={orgResult?.memberships ?? []}
      activeOrgId={orgResult?.active.organizationId ?? null}
    >
      {children}
    </PlatformShell>
  );
}
