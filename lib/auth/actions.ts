"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
