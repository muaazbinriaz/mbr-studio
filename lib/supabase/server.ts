import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client — use inside Server Components, Server
 * Actions, and Route Handlers (never inside a Client Component).
 *
 * Reads the session from Next.js's cookies() so RLS is enforced as
 * the currently logged-in user, same as the browser client. The
 * try/catch around cookies().set() is the official Supabase SSR
 * pattern — Server Components can't set cookies, only Server Actions
 * and Route Handlers can, so this client is written to work in all
 * three without throwing when called from a Server Component (the
 * catch is safe to ignore there because middleware.ts is what
 * actually refreshes the session cookie on every request).
 *
 * Usage:
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 *   const { data } = await supabase.from("organizations").select();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // Session refresh is handled by middleware.ts instead.
          }
        },
      },
    },
  );
}
