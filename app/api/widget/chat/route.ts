import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/knowledge-base/embed";
import { buildAgentSystemPrompt } from "@/lib/chat/agent-system-prompt";
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
  const fail = (status: number, message: string, extra?: Record<string, string>) =>
    NextResponse.json({ error: message }, { status, headers: cors(extra) });

  // -- Parse + validate body --------------------------------------------
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

  // -- Step 1 & 2: resolve + verify the embed key. NEVER trust an
  //    organization_id/agent_id from the request body directly — always
  //    re-derive them from this verified lookup. ------------------------
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
    .select("name, slug, allowed_domains, monthly_message_limit")
    .eq("id", organizationId)
    .maybeSingle();

  if (!org) {
    return fail(404, "Organization not found.");
  }

  // -- Step 3: origin allowlist. Empty allowed_domains = still in setup,
  //    allow all origins. Full TXT domain-ownership verification is a
  //    Prompt 03 feature — this is just the simple allowlist check. -----
  if (org.allowed_domains && org.allowed_domains.length > 0) {
    const isAllowed = origin ? org.allowed_domains.some((d) => originMatchesDomain(origin, d)) : false;
    if (!isAllowed) {
      return fail(403, "This domain is not authorized to use this chat widget.");
    }
  }

  // -- Step 4: rate-limit per organization, not per IP — many visitors
  //    share one client's widget. -----------------------------------------
  const { allowed, retryAfterSeconds } = checkRateLimitFor(`widget-org:${organizationId}`, {
    windowMs: WIDGET_RATE_WINDOW_MS,
    maxRequests: WIDGET_MAX_MESSAGES_PER_ORG_PER_MINUTE,
  });
  if (!allowed) {
    return fail(429, "This chat is receiving a lot of traffic right now — please try again shortly.", {
      "Retry-After": String(retryAfterSeconds ?? 30),
    });
  }

  // -- Step 5: monthly message limit. Graceful in-widget message, not a
  //    hard error, and we stop BEFORE calling the LLM. --------------------
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
        reply: "This business has reached its chat limit this month — please use their contact form instead.",
      },
      { headers: cors() },
    );
  }

  // -- Step 6: embed the incoming message + vector search, scoped to the
  //    VERIFIED agentId only — never a client-supplied one. ---------------
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
    // Degrade gracefully — answer with no retrieved context instead of
    // 500ing on the visitor if embeddings/search hiccup.
    console.error("[widget/chat] embedding/vector search failed:", err);
  }

  // -- Step 7: build the per-agent system prompt. See
  //    lib/chat/agent-system-prompt.ts — that's the exact function
  //    Prompt 03 extends (GUARDRAILS_INJECTION_POINT / LEAD_CAPTURE_TRIGGER_POINT
  //    are marked inside it). --------------------------------------------
  const systemPrompt = buildAgentSystemPrompt({
    orgName: org.name,
    retrievedChunks: matches.map((m) => m.content),
  });

  // -- Step 9 (part 1): find-or-create the conversation, insert the user
  //    message now (before calling the LLM), so it's recorded even if the
  //    LLM call itself fails. ---------------------------------------------
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("agent_id", agentId)
    .eq("visitor_id", visitorId)
    .eq("channel", "website")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation?.id as string | undefined;
  let isNewConversation = false;

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
    await bumpDailyAnalytics(supabase, agentId, organizationId, { total_conversations: 1 });
  }

  // -- Step 8: call the LLM. ------------------------------------------------
  const model = openrouter(WIDGET_MODEL, { extraBody: { models: FALLBACK_MODELS } });

  const result = streamText({
    model,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
    maxOutputTokens: 500,
    onFinish: async ({ text }) => {
      // -- Step 9 (part 2): store the assistant reply + bump last_message_at.
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

      // -- Step 11: analytics, populated now so Prompt 03's dashboard has
      //    real historical data once it's built. --------------------------
      await bumpDailyAnalytics(supabase, agentId, organizationId, {
        total_messages: 2, // user + assistant
        resolved_by_ai: 1,
      });
    },
  });

  // -- Step 12: stream the response back to the widget as plain text. ------
  // (Step 10's LEAD_CAPTURE_TRIGGER_POINT lives inside the system prompt
  // builder, not here — see lib/chat/agent-system-prompt.ts.)
  return result.toTextStreamResponse({ headers: cors() });
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

function originMatchesDomain(origin: string, domain: string): boolean {
  try {
    const { hostname } = new URL(origin);
    const cleanDomain = domain.trim().toLowerCase();
    if (cleanDomain.startsWith("*.")) {
      const base = cleanDomain.slice(2);
      return hostname === base || hostname.endsWith(`.${base}`);
    }
    return hostname === cleanDomain;
  } catch {
    return false;
  }
}

/**
 * Read-then-write daily analytics bump. Not perfectly atomic under
 * heavy concurrent traffic (two simultaneous requests could both read
 * the same starting count) — acceptable for MVP volumes. If this ever
 * matters, replace with a Postgres function that does the increment
 * atomically (e.g. `on conflict do update set total_messages =
 * agent_daily_analytics.total_messages + excluded.total_messages`).
 */
async function bumpDailyAnalytics(
  supabase: ReturnType<typeof createAdminClient>,
  agentId: string,
  organizationId: string,
  fields: Partial<{ total_conversations: number; total_messages: number; resolved_by_ai: number }>,
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("agent_daily_analytics")
    .select("id, total_conversations, total_messages, resolved_by_ai")
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
    });
    return;
  }

  await supabase
    .from("agent_daily_analytics")
    .update({
      total_conversations: existing.total_conversations + (fields.total_conversations ?? 0),
      total_messages: existing.total_messages + (fields.total_messages ?? 0),
      resolved_by_ai: existing.resolved_by_ai + (fields.resolved_by_ai ?? 0),
    })
    .eq("id", existing.id);
}
