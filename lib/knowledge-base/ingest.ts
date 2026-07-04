import { createAdminClient } from "@/lib/supabase/admin";
import { chunkText } from "./chunk";
import { embedText } from "./embed";

/**
 * Runs the full ingestion pipeline for a single knowledge base document:
 * load -> chunk -> embed each chunk -> store -> mark ready (or error).
 *
 * Deliberately takes only a document ID and does its own data access —
 * no `request`/`response` objects touch this function — so it can be
 * dropped into a background queue (Vercel Cron, a jobs table, etc.)
 * later without changing its internals. For MVP it's called
 * synchronously from the server action that creates/re-indexes a
 * document (see app/(platform-client)/dashboard/knowledge-base/actions.ts).
 *
 * Uses the service-role client because it needs to write
 * knowledge_base_chunks rows regardless of which user triggered it —
 * callers are responsible for verifying the caller actually owns this
 * document before invoking this function (RLS won't protect you here,
 * this bypasses it on purpose).
 */
export async function ingestDocument(documentId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: doc, error: loadError } = await supabase
    .from("knowledge_base_documents")
    .select("id, agent_id, organization_id, raw_content")
    .eq("id", documentId)
    .single();

  if (loadError || !doc) {
    throw new Error(loadError?.message ?? `Document ${documentId} not found.`);
  }

  try {
    if (!doc.raw_content || !doc.raw_content.trim()) {
      throw new Error("Document has no content to ingest.");
    }

    const chunks = chunkText(doc.raw_content);
    if (chunks.length === 0) {
      throw new Error("Chunking produced zero chunks from this document's content.");
    }

    // Clear any previous chunks first — this makes ingestDocument safe
    // to call again for re-indexing without accumulating stale rows.
    const { error: deleteError } = await supabase
      .from("knowledge_base_chunks")
      .delete()
      .eq("document_id", documentId);
    if (deleteError) throw new Error(deleteError.message);

    const rows: {
      document_id: string;
      agent_id: string;
      organization_id: string;
      content: string;
      embedding: number[];
    }[] = [];

    for (const content of chunks) {
      const embedding = await embedText(content);
      rows.push({
        document_id: documentId,
        agent_id: doc.agent_id,
        organization_id: doc.organization_id,
        content,
        embedding,
      });
    }

    const { error: insertError } = await supabase
      .from("knowledge_base_chunks")
      .insert(rows);
    if (insertError) throw new Error(insertError.message);

    const { error: statusError } = await supabase
      .from("knowledge_base_documents")
      .update({ status: "ready", error_message: null })
      .eq("id", documentId);
    if (statusError) throw new Error(statusError.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ingestion error.";
    console.error(`[ingestDocument] Failed for document ${documentId}:`, message);

    await supabase
      .from("knowledge_base_documents")
      .update({ status: "error", error_message: message })
      .eq("id", documentId);

    throw err;
  }
}
