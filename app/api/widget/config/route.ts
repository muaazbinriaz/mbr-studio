import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimitFor } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CONFIG_WINDOW_MS = 60_000;
const CONFIG_MAX_PER_KEY_PER_MINUTE = 30;

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
    return jsonResponse(
      { error: "Invalid or revoked client key." },
      404,
      origin,
    );
  }

  const { allowed } = checkRateLimitFor(`widget-config:${publicKey}`, {
    windowMs: CONFIG_WINDOW_MS,
    maxRequests: CONFIG_MAX_PER_KEY_PER_MINUTE,
  });
  if (!allowed) {
    return jsonResponse({ error: "Too many requests." }, 429, origin);
  }

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "name, slug, primary_color, accent_color, logo_url, welcome_message, widget_position",
    )
    .eq("id", embedKey.organization_id)
    .maybeSingle();

  if (!org) {
    return jsonResponse({ error: "Organization not found." }, 404, origin);
  }

  const { data: guardrails } = await supabase
    .from("agent_guardrails")
    .select("capture_leads, lead_capture_settings")
    .eq("agent_id", embedKey.agent_id)
    .maybeSingle();

  const { data: agent } = await supabase
    .from("agents")
    .select("greeting_chips")
    .eq("id", embedKey.agent_id)
    .maybeSingle();

  const leadSettings = (guardrails?.lead_capture_settings ?? {}) as {
    ask_name?: boolean;
    ask_email?: boolean;
    ask_phone?: boolean;
    ask_message?: boolean;
  };

  // --- Added reseller parent lookup ---
  let poweredByLabel: string | null = null;
  let poweredByUrl: string | null = null;

  const { data: orgWithParent } = await supabase
    .from("organizations")
    .select("parent_organization_id")
    .eq("id", embedKey.organization_id)
    .maybeSingle();

  if (orgWithParent?.parent_organization_id) {
    const { data: reseller } = await supabase
      .from("organizations")
      .select("is_reseller, reseller_brand_name, reseller_domain")
      .eq("id", orgWithParent.parent_organization_id)
      .maybeSingle();

    if (reseller?.is_reseller && reseller.reseller_brand_name) {
      poweredByLabel = `Powered by ${reseller.reseller_brand_name}`;
      poweredByUrl = reseller.reseller_domain
        ? `https://${reseller.reseller_domain}`
        : null;
    }
  }
  // --- End reseller parent lookup ---

  return jsonResponse(
    {
      orgName: org.name,
      orgSlug: org.slug,
      primaryColor: org.primary_color,
      accentColor: org.accent_color,
      logoUrl: org.logo_url,
      welcomeMessage: org.welcome_message,
      position: org.widget_position,
      greetingChips: agent?.greeting_chips ?? [],
      poweredByLabel, // ✅ added
      poweredByUrl, // ✅ added
      leadCapture: {
        enabled: guardrails?.capture_leads ?? true,
        askName: leadSettings.ask_name ?? true,
        askEmail: leadSettings.ask_email ?? true,
        askPhone: leadSettings.ask_phone ?? false,
        askMessage: leadSettings.ask_message ?? false,
      },
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
