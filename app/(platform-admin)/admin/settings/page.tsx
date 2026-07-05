import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSettingsClient } from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adminRows } = await supabase
    .from("admins")
    .select("user_id, created_at")
    .order("created_at", { ascending: true });

  const adminClient = createAdminClient();
  const admins = await Promise.all(
    (adminRows ?? []).map(async (row) => {
      const { data } = await adminClient.auth.admin.getUserById(row.user_id);
      return {
        userId: row.user_id,
        email: data.user?.email ?? "Unknown",
        createdAt: row.created_at,
        isYou: row.user_id === user?.id,
      };
    }),
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Settings
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Manage who has platform-wide admin access.
      </p>

      <div className="mt-8">
        <AdminSettingsClient admins={admins} currentUserEmail={user?.email} />
      </div>
    </div>
  );
}
