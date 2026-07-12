import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects:
 *   /admin/*      -> must be logged in AND a row in `admins`
 *   /dashboard/*  -> must be logged in (any organization_members role)
 *   /login,/signup -> redirect away if already logged in
 *
 * Everything else (marketing site, /api/chat, /api/contact) is
 * completely untouched — the matcher below only runs this middleware
 * for the paths listed, so (marketing) routes never pay the cost of
 * a Supabase round-trip.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not remove this call. It refreshes the session token
  // and keeps getUser() accurate on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isClientRoute = path.startsWith("/dashboard");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");

  // Not logged in, hitting a protected route -> send to /login
  if ((isAdminRoute || isClientRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Hand the already-verified user to the route so client/dashboard
  // layout.tsx doesn't have to pay for a second getUser() round-trip
  // on every request — this is what was stretching the blocking
  // window before /dashboard's HTML (and its theme-init script)
  // could reach the browser.
  if (user) {
    response.headers.set("x-user-id", user.id);
    if (user.email) response.headers.set("x-user-email", user.email);
  }

  // Logged in but not an admin, hitting /admin/* -> send to client dashboard
  if (isAdminRoute && user) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Already logged in, hitting /login or /signup -> send to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/signup"],
};
