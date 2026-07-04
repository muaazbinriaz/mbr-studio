/**
 * Chunking strategy for knowledge base documents.
 *
 * Rules (Prompt 02, Section 4.1):
 * - Split on paragraph boundaries first.
 * - If a paragraph exceeds ~700 tokens, split further on sentence boundaries.
 * - Target chunk size: 500-800 tokens.
 * - Preserve 1-2 sentences of overlap between adjacent chunks.
 *
 * Token counts here are an approximation (~1.3 tokens per whitespace-split
 * word), which is close enough for chunk-sizing purposes — we don't need
 * exact tokenizer parity with the embeddings model, just consistent chunks.
 */

const TARGET_MIN_TOKENS = 500;
const TARGET_MAX_TOKENS = 800;
const PARAGRAPH_SPLIT_THRESHOLD_TOKENS = 700;
const OVERLAP_SENTENCES = 2;

export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  if (!matches) return [text.trim()].filter(Boolean);
  return matches.map((s) => s.trim()).filter(Boolean);
}

/**
 * Flattens the document into "units" that can be greedily packed into
 * chunks. A whole paragraph is one unit if it's under the split
 * threshold; an oversized paragraph is broken into per-sentence units
 * instead, so it can still be split across multiple chunks.
 */
function toUnits(rawContent: string): string[] {
  const paragraphs = splitParagraphs(rawContent);
  const units: string[] = [];

  for (const paragraph of paragraphs) {
    if (estimateTokens(paragraph) <= PARAGRAPH_SPLIT_THRESHOLD_TOKENS) {
      units.push(paragraph);
    } else {
      units.push(...splitSentences(paragraph));
    }
  }

  return units;
}

function lastSentences(text: string, count: number): string {
  const sentences = splitSentences(text);
  return sentences.slice(-count).join(" ");
}

export function chunkText(rawContent: string): string[] {
  const units = toUnits(rawContent);
  if (units.length === 0) return [];

  const chunks: string[] = [];
  let current = "";
  let currentTokens = 0;

  for (const unit of units) {
    const unitTokens = estimateTokens(unit);

    if (current && currentTokens + unitTokens > TARGET_MAX_TOKENS) {
      // Flush the current chunk, then seed the next one with a small
      // overlap from the end of the chunk we just closed so context
      // isn't lost right at the boundary.
      chunks.push(current.trim());
      const overlap = lastSentences(current, OVERLAP_SENTENCES);
      current = overlap ? `${overlap} ${unit}` : unit;
      currentTokens = estimateTokens(current);
      continue;
    }

    current = current ? `${current}\n\n${unit}` : unit;
    currentTokens += unitTokens;

    // If we've comfortably cleared the target minimum and the next
    // natural unit would push us over budget anyway, we still let the
    // loop above decide — this branch only flushes early when a single
    // unit itself sits right at the max (rare, but avoids one giant
    // chunk if paragraphs happen to land just under the threshold
    // repeatedly).
    if (currentTokens >= TARGET_MAX_TOKENS) {
      chunks.push(current.trim());
      const overlap = lastSentences(current, OVERLAP_SENTENCES);
      current = overlap ?? "";
      currentTokens = current ? estimateTokens(current) : 0;
    }
  }

  if (current.trim()) {
    // Avoid leaving a tiny trailing chunk (just the overlap seed with
    // nothing new) — merge it into the previous chunk instead.
    if (currentTokens < TARGET_MIN_TOKENS / 4 && chunks.length > 0) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}\n\n${current.trim()}`;
    } else {
      chunks.push(current.trim());
    }
  }

  return chunks;
}
