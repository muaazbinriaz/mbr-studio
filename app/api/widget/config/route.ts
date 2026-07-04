import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/widget/config?client=<public_key>
 *
 * Public, unauthenticated — called directly from chatbot.js on
 * whatever third-party site it's embedded on. Returns ONLY
 * non-sensitive branding data. Never return anything else here
 * (no internal ids beyond what's needed, no tokens, no raw_content).
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const publicKey = req.nextUrl.searchParams.get("client");

  if (!publicKey) {
    return jsonResponse({ error: "Missing client key." }, 400, origin);
  }

  const supabase = createAdminClient();

  const { data: embedKey } = await supabase
    .from("embed_keys")
    .select("agent_id, organization_id, revoked_at")
    .eq("public_key", publicKey)
    .maybeSingle();

  if (!embedKey || embedKey.revoked_at) {
    return jsonResponse({ error: "Invalid or revoked client key." }, 404, origin);
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug, primary_color, accent_color, logo_url, welcome_message, widget_position")
    .eq("id", embedKey.organization_id)
    .maybeSingle();

  if (!org) {
    return jsonResponse({ error: "Organization not found." }, 404, origin);
  }

  return jsonResponse(
    {
      orgName: org.name,
      orgSlug: org.slug,
      primaryColor: org.primary_color,
      accentColor: org.accent_color,
      logoUrl: org.logo_url,
      welcomeMessage: org.welcome_message,
      position: org.widget_position,
    },
    200,
    origin,
    { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  );
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin ?? "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin ?? "*",
      ...extraHeaders,
    },
  });
}
