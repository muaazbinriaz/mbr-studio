"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ingestDocument } from "@/lib/knowledge-base/ingest";

/**
 * Resolves the current user's active agent using the RLS-scoped
 * server client — this is what makes ownership checks below actually
 * safe. ingestDocument() itself uses the service-role client and
 * bypasses RLS entirely, so every call site in this file must verify
 * ownership via a plain (non-admin) select/update BEFORE calling it.
 */
async function getActiveAgentForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: agent } = await supabase
    .from("agents")
    .select("id, organization_id")
    .eq("organization_id", membership.organization_id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return agent;
}

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
    // Ran synchronously per Prompt 02 Section 4.2 — manual-text FAQ
    // documents are short enough that this won't time out. ingestDocument
    // itself doesn't touch request/response objects, so it can move to a
    // background queue later without changing its internals.
    await ingestDocument(doc.id);
  } catch (err) {
    console.error("[knowledge-base] ingestion failed:", err);
    revalidatePath("/dashboard/knowledge-base");
    return { error: "Saved, but processing failed — see the status badge below." };
  }

  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}

export async function deleteKnowledgeBaseDocument(documentId: string) {
  // RLS-scoped client — a delete on a document outside the caller's org
  // simply matches zero rows, no explicit ownership check needed.
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

  // Ownership check via the RLS-scoped client — required here because
  // ingestDocument() below uses the service-role client, which would
  // happily process ANY document id regardless of who's calling.
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
