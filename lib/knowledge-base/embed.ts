/**
 * Single entry point for turning text into an embedding vector.
 *
 * Every caller — ingestion, re-indexing, and multi-channel ingestion —
 * must call embedText() rather than hitting a model directly, so the
 * model/dimension is only ever defined in one place.
 *
 * MODEL CHOICE: Google's Gemini text-embedding-004 model via HTTP API.
 * No native binaries, no local model download — works reliably in
 * Vercel's serverless runtime. This replaces @xenova/transformers,
 * which failed in production with a missing libonnxruntime.so error.
 */

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSION = 768;

const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("embedText() called with empty text.");
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey",
    );
  }

  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: trimmed }],
      },
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Gemini embeddings API request failed (${res.status}): ${errorBody}`,
    );
  }

  const data = (await res.json()) as {
    embedding?: { values?: number[] };
  };

  const vector = data.embedding?.values;
  if (!vector) {
    throw new Error(
      "Gemini embeddings API returned no embedding values — unexpected response shape.",
    );
  }

  // Do NOT silently truncate/pad a mismatched vector — that would
  // corrupt vector search results without any visible symptom until
  // someone notices bad answers. Fail loudly instead.
  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${vector.length}. ` +
        `If you've changed EMBEDDING_MODEL, update EMBEDDING_DIMENSION and the ` +
        `vector(...) column size in a new migration to match.`,
    );
  }

  return vector;
}
