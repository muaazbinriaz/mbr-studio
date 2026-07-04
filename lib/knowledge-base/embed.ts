/**
 * Single entry point for turning text into an embedding vector.
 *
 * Every caller — ingestion (this prompt), Prompt 03's re-indexing, and
 * Prompt 04's multi-channel ingestion — must call embedText() rather
 * than hitting an embeddings API directly, so the model/dimension is
 * only ever defined in one place.
 *
 * MODEL CHOICE (documented in docs/platform-setup.md Section 6):
 * OpenRouter (already used for chat completions in this project) does
 * not expose a free embeddings endpoint — it only routes LLM chat
 * completions. So this uses Option B from Prompt 02 Section 3: the
 * Hugging Face Inference API's free tier, calling the open-weight
 * `sentence-transformers/all-MiniLM-L6-v2` model (384-dim output).
 *
 * Requires HF_API_KEY (a free Hugging Face access token) in the
 * environment. See docs/platform-setup.md for how to generate one.
 */

export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
export const EMBEDDING_DIMENSION = 384;

const HF_API_URL = `https://api-inference.huggingface.co/models/${EMBEDDING_MODEL}`;

/**
 * The feature-extraction pipeline for sentence-transformers models can
 * return either an already-pooled sentence vector (number[]) or raw
 * per-token vectors (number[][]), depending on how the model's pipeline
 * tag is registered. Mean-pool defensively so both shapes work.
 */
function meanPool(tokenVectors: number[][]): number[] {
  const dim = tokenVectors[0]?.length ?? 0;
  const sums = new Array(dim).fill(0);
  for (const vec of tokenVectors) {
    for (let i = 0; i < dim; i++) sums[i] += vec[i];
  }
  return sums.map((s) => s / tokenVectors.length);
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error(
      "HF_API_KEY is not set. Generate a free access token at https://huggingface.co/settings/tokens and add it to your environment.",
    );
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("embedText() called with empty text.");
  }

  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: trimmed,
      options: { wait_for_model: true },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Hugging Face embeddings request failed (${res.status}): ${body || res.statusText}`,
    );
  }

  const data = (await res.json()) as unknown;

  let vector: number[];
  if (Array.isArray(data) && Array.isArray(data[0])) {
    vector = meanPool(data as number[][]);
  } else if (Array.isArray(data)) {
    vector = data as number[];
  } else {
    throw new Error("Unexpected response shape from Hugging Face embeddings API.");
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
