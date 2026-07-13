/**
 * Single source of truth for turning an agent's guardrail settings into
 * system-prompt instructions. Two exports:
 *
 * - buildGuardrailInstructions(): just the guardrail text block. Pure
 *   function, no I/O — safe to import into a CLIENT component too, for
 *   the live preview in the Guardrails settings UI.
 * - buildSystemPrompt(): the full widget system prompt (knowledge base
 *   context + guardrails + fallback behavior). This is what
 *   app/api/widget/chat/route.ts calls, replacing
 *   lib/chat/agent-system-prompt.ts's buildAgentSystemPrompt().
 *
 * capture_leads is intentionally NOT translated into a prompt line here
 * — it doesn't change how the AI talks, it changes what the widget/API
 * do with a fallback reply (see LEAD_CAPTURE_TRIGGER_POINT in the widget
 * chat route, built in a later step of Prompt 03).
 */

export interface GuardrailToggles {
  no_competitors: boolean;
  stay_on_topic: boolean;
  no_pricing: boolean;
  always_polite: boolean;
  no_opinions: boolean;
  push_contact: boolean;
  no_refund_promise: boolean;
  capture_leads: boolean;
  custom_rules: string | null;
  tone: string;
  reply_language: string;
}

export const DEFAULT_GUARDRAILS: GuardrailToggles = {
  no_competitors: false,
  stay_on_topic: true,
  no_pricing: false,
  always_polite: true,
  no_opinions: false,
  push_contact: false,
  no_refund_promise: false,
  capture_leads: true,
  custom_rules: null,
  tone: "professional",
  reply_language: "auto",
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional:
    "Clear, competent, and businesslike. No slang, no emojis, no exclamation marks.",
  friendly:
    "Warm and approachable, like a helpful staff member. Contractions are fine; light warmth, no corporate stiffness.",
  formal:
    "Precise and respectful, keeping a professional distance. No contractions, no casual phrasing.",
  casual:
    "Relaxed and conversational, like texting a helpful friend. Contractions and simple words, short sentences.",
  fun: "Upbeat and a little playful. An occasional tasteful emoji is fine, but never at the cost of clarity.",
  concise:
    "As short as possible while still fully answering. No pleasantries, no filler — get straight to the point.",
};

type RuleKey = keyof Pick<
  GuardrailToggles,
  | "stay_on_topic"
  | "no_competitors"
  | "no_pricing"
  | "no_refund_promise"
  | "no_opinions"
  | "always_polite"
  | "push_contact"
>;

const GUARDRAIL_RULE_DEFS: {
  key: RuleKey;
  instruction: (orgName: string) => string;
}[] = [
  {
    key: "stay_on_topic",
    instruction: (orgName) =>
      `Stay strictly on topics related to ${orgName}'s business. If a question is unrelated (general knowledge, other countries, other companies, coding help, personal advice, etc.), do NOT answer any part of it — not even a brief factual answer before redirecting. Just decline in one short sentence and redirect back to ${orgName}.`,
  },
  {
    key: "no_competitors",
    instruction: (orgName) =>
      `Never mention, compare against, or recommend competing businesses, products, or brands — even if the visitor asks directly. Redirect to what ${orgName} offers instead.`,
  },
  {
    key: "no_pricing",
    instruction: () =>
      `Never state a specific price, discount, or number, even if a price appears in your knowledge base context. If asked about pricing, say it depends on their specific needs and encourage them to contact the business directly.`,
  },
  {
    key: "no_refund_promise",
    instruction: () =>
      `Never promise, guarantee, or commit to a refund, return, exchange, or any binding policy outcome. Say refund/return requests must go through the business directly.`,
  },
  {
    key: "no_opinions",
    instruction: () =>
      `Never share personal opinions, preferences, or subjective judgments. Stick to stating facts about the business.`,
  },
  {
    key: "always_polite",
    instruction: () =>
      `Always remain calm, courteous, and patient — even if the visitor is rude, frustrated, or repeats themselves. Never mirror hostility.`,
  },
  {
    key: "push_contact",
    instruction: () =>
      `For anything beyond a simple factual question already answered by the knowledge base, actively encourage the visitor to reach out to the business directly.`,
  },
];

function buildLanguageInstruction(replyLanguage: string): string {
  if (!replyLanguage || replyLanguage === "auto") {
    return "Reply in the same language the visitor writes in.";
  }
  return `Always reply in ${replyLanguage}, regardless of what language the visitor writes in.`;
}

export function buildGuardrailInstructions(
  guardrails: GuardrailToggles | null,
  orgName: string,
): string {
  const g = guardrails ?? DEFAULT_GUARDRAILS;
  const lines: string[] = [];

  for (const rule of GUARDRAIL_RULE_DEFS) {
    if (g[rule.key]) {
      lines.push(`- ${rule.instruction(orgName)}`);
    }
  }

  const toneDescription =
    TONE_DESCRIPTIONS[g.tone] ?? TONE_DESCRIPTIONS.professional;
  lines.push(`- Tone: ${toneDescription}`);
  lines.push(`- ${buildLanguageInstruction(g.reply_language)}`);

  if (g.custom_rules && g.custom_rules.trim()) {
    lines.push(`- ${g.custom_rules.trim()}`);
  }

  return lines.join("\n");
}

export interface BuildSystemPromptInput {
  orgName: string;
  retrievedChunks: string[];
  guardrails: GuardrailToggles | null;
  industryContext?: string | null;
  channel?: "website" | "whatsapp" | "messenger" | "instagram";
}

export function buildSystemPrompt({
  orgName,
  retrievedChunks,
  guardrails,
  industryContext,
  channel,
}: BuildSystemPromptInput): string {
  const contextBlock =
    retrievedChunks.length > 0
      ? retrievedChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join("\n\n")
      : "(No matching knowledge base content was found for this question.)";

  const guardrailBlock = buildGuardrailInstructions(guardrails, orgName);
  // Every channel this agent replies through — the website widget bubble
  // AND WhatsApp/Messenger/Instagram — renders replies as plain text, not
  // parsed markdown. Without this instruction the model defaults to
  // markdown-style structure (**bold**, "- " bullets, headers) for
  // anything list-like, which shows up to real visitors as literal
  // asterisks and dashes instead of formatting.
  const channelNote =
    "\n- Reply in plain text only — no markdown (no **, no #, no bullet dashes). Use short sentences or numbered points in prose instead of lists.";

  return `You are the AI assistant for ${orgName}, embedded on their website via a chat widget.

## Hard rules
- If asked who built you, who made you, who created you, or who you work for — answer directly and confidently: you are the AI assistant built for ${orgName}. This is NOT a knowledge-base question; never give the "I don't have that on hand" fallback for it.
- For questions about ${orgName}'s specific facts (prices, hours, policies, history, products) — answer ONLY using the "Knowledge base context" below. Do not invent facts that aren't present in the context.
- If the knowledge base context doesn't cover a question that IS about ${orgName}'s business, say so plainly and offer to connect them with the team — never guess to fill the gap.
- Never claim to be human.

## Behavior rules for this agent
${guardrailBlock}${channelNote}
${industryContext ? `\n## Business context\n${industryContext}\n` : ""}
## Knowledge base context
${contextBlock}

## Fallback behavior
When the context doesn't cover a question, respond naturally along the lines of: "I don't have that on hand, but I can let the team know you're asking" — don't dress up a non-answer as if it were one.
`;
}
