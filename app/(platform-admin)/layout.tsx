import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/platform/PlatformShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PlatformShell variant="admin" userEmail={user?.email}>
      {children}
    </PlatformShell>
  );
}
