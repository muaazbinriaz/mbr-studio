import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * Turns raw scraped website text (nav/footer already stripped by
 * scrapePage(), but otherwise an unstructured wall of text) into a
 * clean, organized knowledge base document — the missing step between
 * "we fetched the page" and "this is good enough to answer customers
 * from." Mirrors the same provider/model pattern already used in
 * lib/channels/process-inbound-message.ts, so this doesn't introduce
 * a second AI-calling convention into the codebase.
 *
 * Deliberately conservative: told never to invent facts, and to omit
 * sections the source page doesn't actually cover, rather than padding
 * with generic filler. If structuring fails (model outage, empty
 * output), callers should fall back to the raw scraped text rather
 * than blocking the add flow entirely — see scrapeForPreview() in
 * knowledge-base/actions.ts.
 */

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
const STRUCTURE_MODEL = "openrouter/free";
const FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-7b-instruct:free",
];

const SYSTEM_PROMPT =
  "You clean up raw scraped website text into a well-organized knowledge " +
  "base document for an AI customer support agent to read. You only use " +
  "facts that are actually present in the source text — you never invent " +
  "prices, hours, policies, or details. Return plain text only: no markdown " +
  "symbols like #, *, or -, since this is read directly by both an AI model " +
  "and a plain-text viewer with no markdown rendering.";

const MAX_INPUT_CHARS = 12000;

export interface StructureInput {
  /** URL, filename, or entry title — used only as context in the prompt. */
  source: string;
  title: string;
  rawText: string;
}

export interface StructureResult {
  title: string;
  content: string;
}

export async function structureScrapedContent(
  input: StructureInput,
): Promise<StructureResult> {
  const trimmedRaw = input.rawText.trim();

  if (!trimmedRaw || trimmedRaw.length < 40) {
    throw new Error(
      "This page didn't have enough readable text to build a knowledge base entry from.",
    );
  }

  const truncated =
    trimmedRaw.length > MAX_INPUT_CHARS
      ? `${trimmedRaw.slice(0, MAX_INPUT_CHARS)}\n[content truncated to fit processing limits]`
      : trimmedRaw;

  const prompt = `Source: ${input.source}
Title: ${input.title}

RAW SCRAPED TEXT:
${truncated}

Turn this into a clean knowledge base document a support AI can read.

Rules:
- Organize into sections ONLY where the source actually has that content: ABOUT, PRODUCTS & SERVICES, PRICING, CONTACT, HOURS, DELIVERY, RETURNS & REFUNDS, FAQ. Skip any section with nothing to say — do not write "Not specified" or similar filler.
- Each section header goes on its own line in plain capital letters (e.g. ABOUT), followed by a blank line, then the content for that section.
- Under FAQ, format each item as "Q: <question>" then "A: <answer>" on the next line, with a blank line between each pair.
- Strip navigation labels, cookie notices, "click here" links, repeated boilerplate, and anything that isn't real business information.
- Do not invent prices, hours, or facts that are not present in the source text.
- Plain text only — no markdown symbols.
- Keep it concise and readable, not a wall of text.`;

  const { text } = await generateText({
    model: openrouter(STRUCTURE_MODEL, {
      extraBody: { models: FALLBACK_MODELS },
    }),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    maxOutputTokens: 1200,
  });

  const cleaned = text.trim();
  if (!cleaned || cleaned.length < 20) {
    throw new Error(
      "The AI couldn't organize this page's content — try adding it as plain text instead.",
    );
  }

  return { title: input.title, content: cleaned };
}
