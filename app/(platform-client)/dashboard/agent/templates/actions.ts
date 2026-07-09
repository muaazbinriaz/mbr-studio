"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ingestDocument } from "@/lib/knowledge-base/ingest";
import { getTemplateById } from "@/lib/agents/templates";
import { getActiveAgentForCurrentUser } from "@/lib/auth/actions";

export async function applyTemplate(templateId: string) {
  const template = getTemplateById(templateId);
  if (!template) return { error: "Unknown template." };

  const agent = await getActiveAgentForCurrentUser();
  if (!agent) return { error: "No active agent found for your organization." };

  const supabase = await createClient();

  const { error: agentError } = await supabase
    .from("agents")
    .update({
      system_prompt: template.systemPromptContext,
      greeting_chips: template.greetingChips,
    })
    .eq("id", agent.id);
  if (agentError) return { error: agentError.message };

  const { error: guardrailError } = await supabase
    .from("agent_guardrails")
    .upsert(
      { agent_id: agent.id, ...template.guardrailDefaults },
      { onConflict: "agent_id" },
    );
  if (guardrailError) return { error: guardrailError.message };

  for (const faq of template.starterFaqs) {
    const { data: alreadyExists } = await supabase
      .from("knowledge_base_documents")
      .select("id")
      .eq("agent_id", agent.id)
      .eq("title", faq.title)
      .maybeSingle();

    if (alreadyExists) continue; // already added by a previous template apply

    const { data: doc, error: docError } = await supabase
      .from("knowledge_base_documents")
      .insert({
        agent_id: agent.id,
        organization_id: agent.organization_id,
        source_type: "manual_text",
        title: faq.title,
        raw_content: faq.content,
        status: "processing",
      })
      .select("id")
      .single();

    if (docError || !doc) {
      console.error("[applyTemplate] failed to insert starter FAQ:", docError);
      continue;
    }

    try {
      await ingestDocument(doc.id);
    } catch (err) {
      console.error("[applyTemplate] ingestion failed for starter FAQ:", err);
    }
  }

  revalidatePath("/dashboard/agent/guardrails");
  revalidatePath("/dashboard/knowledge-base");
  revalidatePath("/dashboard/agent/templates");

  return { error: null };
}
