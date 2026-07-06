import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { getUnreadInboxCount } from "@/lib/inbox/queries";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(is_reseller)")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    is_reseller: boolean;
  } | null;

  const unreadCount = membership
    ? await getUnreadInboxCount(supabase, membership.organization_id)
    : 0;

  return (
    <PlatformShell
      variant="client"
      userEmail={user?.email}
      navBadges={{ "/dashboard/inbox": unreadCount }}
      isReseller={!!org?.is_reseller}
    >
      {children}
    </PlatformShell>
  );
}
