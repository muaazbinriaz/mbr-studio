"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/actions";

export async function addAdminByEmail(formData: FormData) {
  const caller = await requireAdmin();
  if (caller.error) return { error: caller.error };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Enter an email address." };

  // admins table has no insert policy for regular clients (by design —
  // see migration 0002's comment), so this must go through the
  // service-role client. requireAdmin() above is what keeps this safe.
  const adminClient = createAdminClient();

  let targetUserId: string | null = null;
  let page = 1;
  const perPage = 200;
  // Paginate through auth.users to find a match by email — fine at
  // MVP admin-invite scale.
  while (!targetUserId) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) return { error: error.message };
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) {
      targetUserId = match.id;
      break;
    }
    if (data.users.length < perPage) break;
    page++;
  }

  if (!targetUserId) {
    return {
      error: "No account found with that email — they need to sign up first.",
    };
  }

  const { error: insertError } = await adminClient
    .from("admins")
    .insert({ user_id: targetUserId });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This user is already an admin." };
    }
    return { error: insertError.message };
  }

  revalidatePath("/admin/settings");
  return { error: null };
}

export async function removeAdmin(userId: string) {
  const caller = await requireAdmin();
  if (caller.error) return { error: caller.error };

  if (caller.userId === userId) {
    return { error: "You can't remove yourself as an admin." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("admins")
    .delete()
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { error: null };
}
