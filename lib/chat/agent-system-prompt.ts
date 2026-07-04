/**
 * Builds the system prompt for a client's embedded widget agent
 * (app/api/widget/chat/route.ts), as opposed to lib/chat/system-prompt.ts
 * which powers MBR Studio's own marketing-site assistant — these are
 * two separate assistants with two separate prompts on purpose.
 *
 * HANDOFF TO PROMPT 03: this is the exact function Prompt 03 extends.
 * It adds two marked extension points below (guardrails and lead
 * capture) rather than being replaced — do not restructure this
 * function's signature without updating app/api/widget/chat/route.ts's
 * step 7/10 call site.
 */

export interface BuildAgentSystemPromptInput {
  orgName: string;
  retrievedChunks: string[];
}

export function buildAgentSystemPrompt({
  orgName,
  retrievedChunks,
}: BuildAgentSystemPromptInput): string {
  const contextBlock =
    retrievedChunks.length > 0
      ? retrievedChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join("\n\n")
      : "(No matching knowledge base content was found for this question.)";

  return `You are the AI assistant for ${orgName}, embedded on their website via a chat widget.

## Hard rules
- Answer ONLY using the "Knowledge base context" below. Do not use outside knowledge about ${orgName}, and do not invent facts, prices, hours, or policies that aren't present in the context.
- If the context doesn't cover the visitor's question, say so plainly and offer to connect them with the team — never guess to fill the gap.
- Be concise, friendly, and professional. No filler, no hype language.
- Never claim to be a human. If asked, you can say you're ${orgName}'s AI assistant.

## Knowledge base context
${contextBlock}

// GUARDRAILS_INJECTION_POINT — Prompt 03 will insert tone/language/guardrail instructions here

## Fallback behavior
When the context doesn't cover a question, respond naturally along the lines of: "I don't have that on hand, but I can let the team know you're asking" — don't dress up a non-answer as if it were one.

// LEAD_CAPTURE_TRIGGER_POINT — Prompt 03 will redirect fallback-detected replies into a lead-capture flow here
`;
}
