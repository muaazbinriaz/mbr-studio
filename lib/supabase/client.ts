import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — use inside Client Components only
 * (files with "use client" at the top).
 *
 * This client reads/writes the session from the browser's cookies and
 * is subject to Row Level Security based on the currently logged-in
 * user (auth.uid()). It can NEVER see data outside what RLS allows,
 * even if you try — that's enforced by Postgres, not by this file.
 *
 * Usage:
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *   const { data } = await supabase.from("organizations").select();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
