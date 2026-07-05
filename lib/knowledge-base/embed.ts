/**
 * Single entry point for turning text into an embedding vector.
 *
 * Every caller — ingestion, re-indexing, and multi-channel ingestion —
 * must call embedText() rather than hitting a model directly, so the
 * model/dimension is only ever defined in one place.
 *
 * MODEL CHOICE: runs fully locally via @xenova/transformers (no
 * external API, no API key, no network dependency at request time).
 * Uses the same all-MiniLM-L6-v2 model (384-dim output) — the model
 * files (~90MB) are downloaded once and cached on disk on first run,
 * then reused for every subsequent call.
 */

import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIMENSION = 384;

// Cache the pipeline across calls within the same server process —
// loading the model on every request would be slow and wasteful.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      EMBEDDING_MODEL,
    ) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("embedText() called with empty text.");
  }

  const extractor = await getExtractor();

  // mean pooling + normalization gives a single 384-dim sentence
  // vector, matching how sentence-transformers models are meant to
  // be used for semantic search.
  const output = await extractor(trimmed, {
    pooling: "mean",
    normalize: true,
  });

  const vector: number[] = Array.from(output.data as Float32Array);

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
