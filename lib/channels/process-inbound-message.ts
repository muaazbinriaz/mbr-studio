import { createAdminClient } from "@/lib/supabase/admin";
import { triggerWebhookDispatch } from "@/lib/webhooks/trigger";
import { embedText } from "@/lib/knowledge-base/embed";
import {
  buildSystemPrompt,
  type GuardrailToggles,
} from "@/lib/agents/build-system-prompt";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { NormalizedInboundMessage } from "@/lib/channels/parse-inbound";
import type { ResolvedConnection } from "@/lib/channels/resolve-connection";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
const CHANNEL_MODEL = "openrouter/free";
const FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-7b-instruct:free",
];

export interface ProcessResult {
  shouldReply: boolean;
  replyText?: string;
  conversationId: string;
  agentId: string;
  organizationId: string;
  isNewConversation: boolean;
}

/**
 * Mirrors app/api/widget/chat/route.ts's pipeline (find-or-create
 * conversation, insert message, KB retrieval, buildSystemPrompt, LLM
 * call) but for a single already-resolved inbound channel message.
 * Does NOT send the reply out — that's the caller's job (Step 5d),
 * so this stays a pure "process + generate reply" function.
 */
export async function processInboundMessage(
  msg: NormalizedInboundMessage,
  connection: ResolvedConnection,
): Promise<ProcessResult> {
  const supabase = createAdminClient();
  const { agentId, organizationId } = connection;

  // -- Find-or-create conversation --------------------------------------
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id, status")
    .eq("agent_id", agentId)
    .eq("channel", msg.channel)
    .eq("channel_thread_id", msg.externalThreadId)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation?.id as string | undefined;
  let isNewConversation = false;

  if (!conversationId) {
    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({
        agent_id: agentId,
        organization_id: organizationId,
        channel: msg.channel,
        channel_thread_id: msg.externalThreadId,
        visitor_id: msg.externalThreadId,
      })
      .select("id")
      .single();

    if (error || !newConversation) {
      throw new Error(`Failed to create conversation: ${error?.message}`);
    }
    conversationId = newConversation.id;
    isNewConversation = true;

    await supabase.from("webhook_events").insert({
      organization_id: organizationId,
      event_type: "conversation.started",
      payload: { conversation_id: conversationId, channel: msg.channel },
    });
    triggerWebhookDispatch();
  }
  if (!conversationId) {
    throw new Error(
      "conversationId is unexpectedly undefined after find-or-create.",
    );
  }

  // Insert inbound user message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: agentId,
    organization_id: organizationId,
    role: "user",
    content: msg.text,
  });

  // -- PROMPT 05 INTEGRATION POINT ---------------------------------------
  // If a human has taken over this conversation, do not call the AI —
  // just store the message (already done above) and let the human
  // handoff inbox (Prompt 05) surface it.
  const status = existingConversation?.status;
  if (status === "human_handling") {
    return {
      shouldReply: false,
      conversationId,
      agentId,
      organizationId,
      isNewConversation,
    };
  }

  // -- Guardrails + org name + industry context --------------------------
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

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

  // -- KB retrieval --------------------------------------------------------
  let matches: { content: string }[] = [];
  try {
    const queryEmbedding = await embedText(msg.text);
    const { data: matchRows } = await supabase.rpc(
      "match_knowledge_base_chunks",
      {
        query_embedding: queryEmbedding,
        target_agent_id: agentId,
        match_count: 5,
      },
    );
    matches = matchRows ?? [];
  } catch (err) {
    console.error("[processInboundMessage] KB retrieval failed:", err);
  }

  const systemPrompt = buildSystemPrompt({
    orgName: org?.name ?? "the business",
    retrievedChunks: matches.map((m) => m.content),
    guardrails: guardrails ?? null,
    industryContext: agentRow?.system_prompt ?? null,
    channel: msg.channel,
  });

  // -- LLM call (non-streaming — we need full text before sending out) ---
  const { text: replyText } = await generateText({
    model: openrouter(CHANNEL_MODEL, {
      extraBody: { models: FALLBACK_MODELS },
    }),
    system: systemPrompt,
    messages: [{ role: "user", content: msg.text }],
    maxOutputTokens: 500,
  });

  return {
    shouldReply: true,
    replyText,
    conversationId,
    agentId,
    organizationId,
    isNewConversation,
  };
}
