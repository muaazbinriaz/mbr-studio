import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { triggerWebhookDispatch } from "@/lib/webhooks/trigger";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimitFor } from "@/lib/rate-limit";

export const runtime = "nodejs";

const LEAD_CAPTURE_WINDOW_MS = 60_000;
const LEAD_CAPTURE_MAX_PER_ORG_PER_MINUTE = 10;

const leadCaptureSchema = z.object({
  publicKey: z.string().trim().min(1),
  visitorId: z.string().trim().min(1).max(200),
  conversationId: z.string().trim().min(1).optional(),
  name: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = () => ({ "Access-Control-Allow-Origin": origin ?? "*" });
  const fail = (status: number, msg: string) =>
    NextResponse.json({ error: msg }, { status, headers: cors() });

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return fail(400, "Invalid JSON body.");
  }

  const parsed = leadCaptureSchema.safeParse(rawBody);
  if (!parsed.success) return fail(400, "Invalid request.");

  const { publicKey, visitorId, conversationId, name, email, phone, message } =
    parsed.data;

  if (!name && !email && !phone) {
    return fail(400, "Please provide at least one contact detail.");
  }

  const supabase = createAdminClient();

  // Re-derive agent/org from the verified embed key — never trust a
  // client-supplied organization/agent id.
  const { data: embedKey } = await supabase
    .from("embed_keys")
    .select("agent_id, organization_id, revoked_at")
    .eq("public_key", publicKey)
    .maybeSingle();

  if (!embedKey || embedKey.revoked_at) {
    return fail(404, "Invalid or revoked client key.");
  }

  // Rate-limit per organization — each submission also fires a webhook
  // dispatch, so unlimited calls = free write + webhook amplification.
  const { allowed } = checkRateLimitFor(
    `lead-capture-org:${embedKey.organization_id}`,
    {
      windowMs: LEAD_CAPTURE_WINDOW_MS,
      maxRequests: LEAD_CAPTURE_MAX_PER_ORG_PER_MINUTE,
    },
  );
  if (!allowed) {
    return fail(429, "Too many submissions — please try again shortly.");
  }

  // If a conversationId was supplied, confirm it actually belongs to
  // this agent + visitor before linking a lead to it.
  let verifiedConversationId: string | null = null;
  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("agent_id", embedKey.agent_id)
      .eq("visitor_id", visitorId)
      .maybeSingle();
    verifiedConversationId = conv?.id ?? null;
  }

  const { error: insertError } = await supabase.from("leads").insert({
    agent_id: embedKey.agent_id,
    organization_id: embedKey.organization_id,
    conversation_id: verifiedConversationId,
    visitor_name: name || null,
    visitor_email: email || null,
    visitor_phone: phone || null,
    notes: message || null,
  });

  if (insertError) {
    console.error("[widget/lead-capture] insert failed:", insertError);
    return fail(500, "Could not save your details — please try again.");
  }

  // Per Prompt 01's forward-looking webhook design — Prompt 07 builds
  // the dispatcher, this just makes sure the event exists once it does.
  await supabase.from("webhook_events").insert({
    organization_id: embedKey.organization_id,
    event_type: "lead.captured",
    payload: { name: name || null, email: email || null, phone: phone || null },
  });
  triggerWebhookDispatch();

  return NextResponse.json({ success: true }, { headers: cors() });
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin ?? "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
