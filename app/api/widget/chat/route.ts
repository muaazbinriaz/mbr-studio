import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/knowledge-base/embed";
import {
  buildSystemPrompt,
  type GuardrailToggles,
} from "@/lib/agents/build-system-prompt";
import { withLeadCaptureMarker } from "@/lib/chat/lead-capture";
import { checkRateLimitFor } from "@/lib/rate-limit";
import { widgetChatSchema } from "@/lib/validations/widget-chat";

export const runtime = "nodejs";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
const WIDGET_MODEL = "openrouter/free";
const FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-7b-instruct:free",
];

const WIDGET_RATE_WINDOW_MS = 60_000;
const WIDGET_MAX_MESSAGES_PER_ORG_PER_MINUTE = 20;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = (extra?: Record<string, string>) => ({
    "Access-Control-Allow-Origin": origin ?? "*",
    ...extra,
  });
  const fail = (
    status: number,
    message: string,
    extra?: Record<string, string>,
  ) => NextResponse.json({ error: message }, { status, headers: cors(extra) });

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return fail(400, "Invalid JSON body.");
  }

  const parsed = widgetChatSchema.safeParse(rawBody);
  if (!parsed.success) {
    return fail(400, "Invalid request.");
  }
  const { publicKey, visitorId, message, pageUrl } = parsed.data;

  const supabase = createAdminClient();

  // -- Resolve + verify the embed key. -------------------------------------
  const { data: embedKey } = await supabase
    .from("embed_keys")
    .select("agent_id, organization_id, revoked_at")
    .eq("public_key", publicKey)
    .maybeSingle();

  if (!embedKey || embedKey.revoked_at) {
    return fail(404, "Invalid or revoked client key.");
  }
  const agentId = embedKey.agent_id;
  const organizationId = embedKey.organization_id;

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "name, slug, allowed_domains, monthly_message_limit, primary_domain, domain_verify_status",
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (!org) {
    return fail(404, "Organization not found.");
  }

  // -- Domain checks (Prompt 03, Section 6). -------------------------------
  // Before verification (or no primary_domain set yet): fall back to the
  // original allowlist-only behavior, so a client can test the widget
  // before finishing DNS setup.
  if (org.domain_verify_status === "suspended") {
    return fail(
      403,
      "This domain's verification has lapsed. Please re-verify in your dashboard.",
    );
  }

  if (org.domain_verify_status === "verified" && org.primary_domain) {
    const isVerifiedOrigin = origin
      ? originMatchesDomain(origin, org.primary_domain)
      : false;
    const isAllowlisted =
      org.allowed_domains && org.allowed_domains.length > 0 && origin
        ? org.allowed_domains.some((d) => originMatchesDomain(origin, d))
        : false;

    if (!isVerifiedOrigin && !isAllowlisted) {
      return fail(
        403,
        "This domain is not authorized to use this chat widget.",
      );
    }
  } else if (org.allowed_domains && org.allowed_domains.length > 0) {
    const isAllowed = origin
      ? org.allowed_domains.some((d) => originMatchesDomain(origin, d))
      : false;
    if (!isAllowed) {
      return fail(
        403,
        "This domain is not authorized to use this chat widget.",
      );
    }
  }

  // -- Rate-limit per organization. ----------------------------------------
  const { allowed, retryAfterSeconds } = checkRateLimitFor(
    `widget-org:${organizationId}`,
    {
      windowMs: WIDGET_RATE_WINDOW_MS,
      maxRequests: WIDGET_MAX_MESSAGES_PER_ORG_PER_MINUTE,
    },
  );
  if (!allowed) {
    return fail(
      429,
      "This chat is receiving a lot of traffic right now — please try again shortly.",
      {
        "Retry-After": String(retryAfterSeconds ?? 30),
      },
    );
  }

  // -- Monthly message limit. ----------------------------------------------
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: messagesThisMonth } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", monthStart.toISOString());

  if ((messagesThisMonth ?? 0) >= org.monthly_message_limit) {
    return NextResponse.json(
      {
        limitReached: true,
        reply:
          "This business has reached its chat limit this month — please use their contact form instead.",
      },
      { headers: cors() },
    );
  }

  // -- Guardrails + industry context. --------------------------------------
  const { data: guardrails } = await supabase
    .from("agent_guardrails")
    .select(
      "no_competitors, stay_on_topic, no_pricing, always_polite, no_opinions, push_contact, no_refund_promise, capture_leads, custom_rules, tone, reply_language",
    )
    .eq("agent_id", agentId)
    .maybeSingle<GuardrailToggles>();

  const { data: agentRow } = await supabase
    .from("agents")
    .select("system_prompt")
    .eq("id", agentId)
    .maybeSingle();

  // -- Embed + vector search, scoped to the VERIFIED agentId only. ---------
  let matches: { id: string; content: string; similarity: number }[] = [];
  try {
    const queryEmbedding = await embedText(message);
    const { data: matchRows, error: matchError } = await supabase.rpc(
      "match_knowledge_base_chunks",
      {
        query_embedding: queryEmbedding,
        target_agent_id: agentId,
        match_count: 5,
      },
    );
    if (matchError) throw new Error(matchError.message);
    matches = matchRows ?? [];
  } catch (err) {
    console.error("[widget/chat] embedding/vector search failed:", err);
  }

  const systemPrompt = buildSystemPrompt({
    orgName: org.name,
    retrievedChunks: matches.map((m) => m.content),
    guardrails: guardrails ?? null,
    industryContext: agentRow?.system_prompt ?? null,
  });

  // -- Unique-visitor tracking for analytics. ------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const { data: visitorLogRows, error: visitorLogError } = await supabase
    .from("agent_daily_visitors")
    .upsert(
      {
        agent_id: agentId,
        date: today,
        visitor_id: visitorId,
        channel: "website",
      },
      {
        onConflict: "agent_id,date,visitor_id,channel",
        ignoreDuplicates: true,
      },
    )
    .select();

  if (visitorLogError) {
    console.error("[widget/chat] visitor log failed:", visitorLogError);
  }
  const isNewVisitorToday =
    !visitorLogError && (visitorLogRows?.length ?? 0) > 0;

  // -- Find-or-create the conversation. ------------------------------------
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id, lead_capture_shown")
    .eq("agent_id", agentId)
    .eq("visitor_id", visitorId)
    .eq("channel", "website")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation?.id as string | undefined;
  let isNewConversation = false;
  const leadCaptureAlreadyShown =
    existingConversation?.lead_capture_shown ?? false;

  if (!conversationId) {
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        agent_id: agentId,
        organization_id: organizationId,
        channel: "website",
        visitor_id: visitorId,
        visitor_page_url: pageUrl || null,
      })
      .select("id")
      .single();

    if (convError || !newConversation) {
      console.error("[widget/chat] failed to create conversation:", convError);
      return fail(500, "Something went wrong starting the conversation.");
    }
    conversationId = newConversation.id;
    isNewConversation = true;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: agentId,
    organization_id: organizationId,
    role: "user",
    content: message,
  });

  if (isNewConversation) {
    await bumpDailyAnalytics(supabase, agentId, organizationId, {
      total_conversations: 1,
    });
  }

  // -- Call the LLM. --------------------------------------------------------
  const model = openrouter(WIDGET_MODEL, {
    extraBody: { models: FALLBACK_MODELS },
  });

  const result = streamText({
    model,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
    maxOutputTokens: 500,
    onFinish: async ({ text }) => {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        agent_id: agentId,
        organization_id: organizationId,
        role: "assistant",
        content: text,
      });
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId as string);

      await bumpDailyAnalytics(supabase, agentId, organizationId, {
        total_messages: 2,
        resolved_by_ai: 1,
        unique_visitors: isNewVisitorToday ? 1 : 0,
      });
    },
  });

  // -- Stream back, wrapped with the lead-capture sentinel marker. ---------
  const shouldCheckLeadCapture =
    (guardrails?.capture_leads ?? true) && !leadCaptureAlreadyShown;

  const baseResponse = result.toTextStreamResponse({
    headers: cors({
      "X-Conversation-Id": conversationId as string,
      "Access-Control-Expose-Headers": "X-Conversation-Id",
    }),
  });

  const wrappedBody = withLeadCaptureMarker(
    baseResponse.body as ReadableStream<Uint8Array>,
    shouldCheckLeadCapture,
    async () => {
      await supabase
        .from("conversations")
        .update({ lead_capture_shown: true })
        .eq("id", conversationId as string);
    },
  );

  return new Response(wrappedBody, {
    status: baseResponse.status,
    headers: baseResponse.headers,
  });
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function originMatchesDomain(originUrl: string, domain: string): boolean {
  try {
    const { hostname } = new URL(originUrl);
    const cleanDomain = domain.trim().toLowerCase();
    if (cleanDomain.startsWith("*.")) {
      const base = cleanDomain.slice(2);
      return hostname === base || hostname.endsWith(`.${base}`);
    }
    return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
  } catch {
    return false;
  }
}

async function bumpDailyAnalytics(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  organizationId: string,
  fields: Partial<{
    total_conversations: number;
    total_messages: number;
    resolved_by_ai: number;
    unique_visitors: number;
  }>,
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("agent_daily_analytics")
    .select(
      "id, total_conversations, total_messages, resolved_by_ai, unique_visitors",
    )
    .eq("agent_id", agentId)
    .eq("date", today)
    .eq("channel", "website")
    .maybeSingle();

  if (!existing) {
    await supabase.from("agent_daily_analytics").insert({
      agent_id: agentId,
      organization_id: organizationId,
      date: today,
      channel: "website",
      total_conversations: fields.total_conversations ?? 0,
      total_messages: fields.total_messages ?? 0,
      resolved_by_ai: fields.resolved_by_ai ?? 0,
      unique_visitors: fields.unique_visitors ?? 0,
    });
    return;
  }

  await supabase
    .from("agent_daily_analytics")
    .update({
      total_conversations:
        existing.total_conversations + (fields.total_conversations ?? 0),
      total_messages: existing.total_messages + (fields.total_messages ?? 0),
      resolved_by_ai: existing.resolved_by_ai + (fields.resolved_by_ai ?? 0),
      unique_visitors: existing.unique_visitors + (fields.unique_visitors ?? 0),
    })
    .eq("id", existing.id);
}
