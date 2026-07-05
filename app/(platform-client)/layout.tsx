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
    .select("organization_id")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  const unreadCount = membership
    ? await getUnreadInboxCount(supabase, membership.organization_id)
    : 0;

  return (
    <PlatformShell
      variant="client"
      userEmail={user?.email}
      navBadges={{ "/dashboard/inbox": unreadCount }}
    >
      {children}
    </PlatformShell>
  );
}
