"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestDocument } from "@/lib/knowledge-base/ingest";
import { discoverPages, scrapePage } from "@/lib/knowledge-base/scrape";
import { extractPdfText } from "@/lib/knowledge-base/pdf";
import { getActiveAgentForCurrentUser } from "@/lib/auth/actions";
import { embedText } from "@/lib/knowledge-base/embed";

// NOTE: ingestDocument() uses the service-role client and bypasses RLS
// entirely, so every call site in this file must verify ownership via
// a plain (non-admin) select/update — using getActiveAgentForCurrentUser()
// above, which is RLS-scoped — BEFORE calling it.

export async function addKnowledgeBaseDocument(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const rawContent = String(formData.get("rawContent") ?? "").trim();
  const requestedType = String(formData.get("sourceType") ?? "manual_text");
  const sourceType = requestedType === "faq_pair" ? "faq_pair" : "manual_text";

  if (!title) return { error: "Give this document a short title." };
  if (!rawContent || rawContent.length < 20) {
    return { error: "Add a bit more detail — at least a few sentences." };
  }

  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("knowledge_base_documents")
    .insert({
      agent_id: agent.id,
      organization_id: agent.organization_id,
      source_type: sourceType,
      title,
      raw_content: rawContent,
      status: "processing",
    })
    .select("id")
    .single();

  if (error || !doc) {
    return {
      error: error?.message ?? "We couldn't save that — try again in a moment.",
    };
  }

  try {
    await ingestDocument(doc.id);
  } catch (err) {
    console.error("[knowledge-base] ingestion failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return {
      error:
        "We saved it, but couldn't process it yet — check the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

// ============================================================
// URL scraping (Prompt 11)
// ============================================================

export async function discoverKnowledgeBaseUrls(rootUrl: string) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) {
    return { error: "No active agent found for your organization.", pages: [] };
  }

  let normalized: string;
  try {
    const parsed = new URL(rootUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    normalized = parsed.href;
  } catch {
    return { error: "Enter a valid URL, e.g. https://example.com", pages: [] };
  }

  try {
    const pages = await discoverPages(normalized);
    return { error: null, pages };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "We couldn't reach that website — check the URL and try again.",
      pages: [],
    };
  }
}

export async function scrapeAndIngestUrl(url: string) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  let scraped: Awaited<ReturnType<typeof scrapePage>>;
  try {
    scraped = await scrapePage(url);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : `Could not scrape ${url}.`,
    };
  }

  const supabase = await createClient();
  const { data: doc, error: insertError } = await supabase
    .from("knowledge_base_documents")
    .insert({
      agent_id: agent.id,
      organization_id: agent.organization_id,
      source_type: "url",
      source_url: url,
      title: scraped.title,
      raw_content: scraped.text,
      status: "processing",
      last_refreshed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    return { error: insertError?.message ?? `Failed to save ${url}.` };
  }

  try {
    await ingestDocument(doc.id);
  } catch (err) {
    console.error("[knowledge-base] url ingestion failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return { error: `Saved ${url}, but processing failed.` };
  }

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

export async function refreshKnowledgeBaseUrlDocument(documentId: string) {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("knowledge_base_documents")
    .select("id, source_url, source_type")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc || doc.source_type !== "url" || !doc.source_url) {
    return { error: "This document has no source URL to refresh from." };
  }

  let scraped: Awaited<ReturnType<typeof scrapePage>>;
  try {
    scraped = await scrapePage(doc.source_url);
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "We couldn't re-scan that page — try again in a moment.",
    };
  }

  await supabase
    .from("knowledge_base_documents")
    .update({
      title: scraped.title,
      raw_content: scraped.text,
      status: "processing",
      error_message: null,
      last_refreshed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  try {
    await ingestDocument(documentId);
  } catch (err) {
    console.error("[knowledge-base] refresh failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return {
      error:
        "We refreshed it, but couldn't reprocess it yet — check the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

// ============================================================
// PDF upload (Prompt 11)
// ============================================================

export async function createPdfUploadUrl(fileName: string) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) {
    return {
      error: "No active agent found for your organization.",
      data: null,
    };
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${agent.organization_id}/${Date.now()}-${safeName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("knowledge-base-pdfs")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return {
      error:
        error?.message ??
        "We couldn't start the upload — try again in a moment.",
      data: null,
    };
  }

  return {
    error: null,
    data: { path, token: data.token, signedUrl: data.signedUrl },
  };
}

export async function ingestUploadedPdf(storagePath: string, fileName: string) {
  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  if (!storagePath.startsWith(`${agent.organization_id}/`)) {
    return { error: "This file does not belong to your organization." };
  }

  const admin = createAdminClient();
  const { data: file, error: downloadError } = await admin.storage
    .from("knowledge-base-pdfs")
    .download(storagePath);

  if (downloadError || !file) {
    return {
      error:
        downloadError?.message ??
        "We couldn't read that file — try uploading it again.",
    };
  }

  const buffer = await file.arrayBuffer();

  let extraction: Awaited<ReturnType<typeof extractPdfText>>;
  try {
    extraction = await extractPdfText(buffer);
  } catch {
    return {
      error:
        "Could not read this PDF — it may be corrupted or in an unsupported format.",
    };
  }

  const supabase = await createClient();

  if (extraction.looksScanned) {
    await supabase.from("knowledge_base_documents").insert({
      agent_id: agent.id,
      organization_id: agent.organization_id,
      source_type: "pdf",
      title: fileName,
      raw_content: extraction.text || null,
      status: "error",
      error_message:
        "This PDF appears to be a scanned image with no selectable text — try re-exporting it as a text-based PDF, or paste the content manually.",
    });
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return { error: null };
  }

  const { data: doc, error: insertError } = await supabase
    .from("knowledge_base_documents")
    .insert({
      agent_id: agent.id,
      organization_id: agent.organization_id,
      source_type: "pdf",
      title: fileName,
      raw_content: extraction.text,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !doc) {
    return {
      error:
        insertError?.message ??
        "We couldn't save that — try again in a moment.",
    };
  }

  try {
    await ingestDocument(doc.id);
  } catch (err) {
    console.error("[knowledge-base] pdf ingestion failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return {
      error:
        "We saved it, but couldn't process it yet — check the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

export async function deleteKnowledgeBaseDocument(documentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("knowledge_base_documents")
    .delete()
    .eq("id", documentId);

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/onboarding");
  return { error: error?.message ?? null };
}

export async function reindexKnowledgeBaseDocument(documentId: string) {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("knowledge_base_documents")
    .select("id")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) {
    return { error: "Document not found." };
  }

  await supabase
    .from("knowledge_base_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", documentId);

  try {
    await ingestDocument(documentId);
  } catch (err) {
    console.error("[knowledge-base] re-index failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return { error: "Re-index failed — see the status badge below." };
  }

  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/onboarding");
  return { error: null };
}

// ============================================================
// Inline edit (Prompt 18)
// ============================================================

export async function updateKnowledgeBaseDocument(
  documentId: string,
  rawContent: string,
) {
  const trimmed = rawContent.trim();
  if (!trimmed || trimmed.length < 20) {
    return { error: "Add a bit more detail — at least a few sentences." };
  }

  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("knowledge_base_documents")
    .select("id")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { error: "Document not found." };

  await supabase
    .from("knowledge_base_documents")
    .update({
      raw_content: trimmed,
      status: "processing",
      error_message: null,
    })
    .eq("id", documentId);

  try {
    await ingestDocument(documentId);
  } catch (err) {
    console.error("[knowledge-base] edit re-ingest failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    revalidatePath("/dashboard/onboarding");
    return {
      error:
        "We saved your edit, but couldn't reprocess it yet — check the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}

// ============================================================
// "Test what your agent knows" — same retrieval path the live
// widget uses (match_knowledge_base_chunks), surfaced for the
// dashboard owner instead of an end visitor.
// ============================================================

// Below this, a match is closer to "any two unrelated sentences of
// English" than to a genuine answer — MiniLM cosine similarity for a
// truly relevant chunk is typically 0.4+, while unrelated content still
// floats around 0.15-0.3 from shared common words alone. Without this
// floor, short/generic queries (e.g. "hi") always returned 5 confident-
// looking results regardless of relevance, which made the tool actively
// misleading rather than just imprecise. Tune down if it starts cutting
// legitimate matches for your content.
const MIN_CONFIDENT_SIMILARITY = 0.35;

export async function testKnowledgeBaseQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return { error: "Type a question first.", matches: [] };

  const agent = await getActiveAgentForCurrentUser();
  if (!agent) {
    return {
      error: "No active agent found for your organization.",
      matches: [],
    };
  }

  const supabase = await createClient();

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(trimmed);
  } catch {
    return {
      error: "We couldn't test that question — try again in a moment.",
      matches: [],
    };
  }

  const { data: matchRows, error: matchError } = await supabase.rpc(
    "match_knowledge_base_chunks",
    {
      query_embedding: queryEmbedding,
      target_agent_id: agent.id,
      match_count: 5,
    },
  );

  if (matchError) {
    return { error: matchError.message, matches: [] };
  }

  // match_knowledge_base_chunks already computes similarity — it was
  // being fetched and immediately discarded. Filtering on it here is
  // what turns "top 5 nearest, however irrelevant" into "the matches
  // we'd actually trust the agent to answer from".
  const confidentRows = (
    (matchRows ?? []) as { id: string; content: string; similarity: number }[]
  ).filter((m) => m.similarity >= MIN_CONFIDENT_SIMILARITY);

  if (confidentRows.length === 0) return { error: null, matches: [] };

  const chunkIds = confidentRows.map((m) => m.id);

  const { data: chunkRows } = await supabase
    .from("knowledge_base_chunks")
    .select("id, document_id")
    .in("id", chunkIds);

  const chunkToDoc = new Map(
    (chunkRows ?? []).map((c) => [c.id, c.document_id]),
  );
  const docIds = Array.from(new Set(chunkToDoc.values()));

  const { data: docs } = await supabase
    .from("knowledge_base_documents")
    .select("id, title, source_type")
    .in("id", docIds);

  const docMap = new Map((docs ?? []).map((d) => [d.id, d]));

  const seen = new Set<string>();
  const matches: {
    documentId: string;
    title: string;
    sourceType: string;
    snippet: string;
    similarity: number;
  }[] = [];

  for (const m of confidentRows) {
    const docId = chunkToDoc.get(m.id);
    if (!docId || seen.has(docId)) continue;
    seen.add(docId);
    const doc = docMap.get(docId);
    matches.push({
      documentId: docId,
      title: doc?.title ?? "Untitled",
      sourceType: doc?.source_type ?? "manual_text",
      snippet:
        m.content.length > 160 ? `${m.content.slice(0, 160)}…` : m.content,
      similarity: m.similarity,
    });
  }

  return { error: null, matches };
}
