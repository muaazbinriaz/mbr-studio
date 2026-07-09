"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestDocument } from "@/lib/knowledge-base/ingest";
import { discoverPages, scrapePage } from "@/lib/knowledge-base/scrape";
import { extractPdfText } from "@/lib/knowledge-base/pdf";
import { getActiveAgentForCurrentUser } from "@/lib/auth/actions";

// NOTE: ingestDocument() uses the service-role client and bypasses RLS
// entirely, so every call site in this file must verify ownership via
// a plain (non-admin) select/update — using getActiveAgentForCurrentUser()
// above, which is RLS-scoped — BEFORE calling it.

export async function addKnowledgeBaseDocument(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const rawContent = String(formData.get("rawContent") ?? "").trim();

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
      source_type: "manual_text",
      title,
      raw_content: rawContent,
      status: "processing",
    })
    .select("id")
    .single();

  if (error || !doc) {
    return { error: error?.message ?? "Failed to save document." };
  }

  try {
    await ingestDocument(doc.id);
  } catch (err) {
    console.error("[knowledge-base] ingestion failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    return {
      error: "Saved, but processing failed — see the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
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
      error: err instanceof Error ? err.message : "Could not reach that site.",
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
    return { error: `Saved ${url}, but processing failed.` };
  }

  revalidatePath("/dashboard/knowledge-base");
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
          : "Could not re-fetch the source page.",
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
    return {
      error:
        "Refreshed, but re-processing failed — see the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
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
      error: error?.message ?? "Could not create an upload URL.",
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
      error: downloadError?.message ?? "Could not download the uploaded file.",
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
    return { error: insertError?.message ?? "Failed to save document." };
  }

  try {
    await ingestDocument(doc.id);
  } catch (err) {
    console.error("[knowledge-base] pdf ingestion failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    return {
      error: "Saved, but processing failed — see the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}

export async function deleteKnowledgeBaseDocument(documentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("knowledge_base_documents")
    .delete()
    .eq("id", documentId);

  revalidatePath("/dashboard/knowledge-base");
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
    return { error: "Re-index failed — see the status badge below." };
  }

  revalidatePath("/dashboard/knowledge-base");
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
    return {
      error: "Saved, but re-processing failed — see the status badge below.",
    };
  }

  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}
