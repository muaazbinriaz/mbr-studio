import { createClient } from "@/lib/supabase/server";
import { KnowledgeBaseClient } from "./KnowledgeBaseClient";

export default async function KnowledgeBasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  let agentId: string | null = null;
  let documents: {
    id: string;
    title: string;
    status: string;
    source_type: string;
    source_url: string | null;
    created_at: string;
    error_message: string | null;
    raw_content: string | null;
  }[] = [];

  if (membership) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    agentId = agent?.id ?? null;

    if (agentId) {
      const { data: docs } = await supabase
        .from("knowledge_base_documents")
        .select(
          "id, title, status, source_type, source_url, created_at, error_message, raw_content",
        )
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      documents = docs ?? [];
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Knowledge Base
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Add the facts your AI agent should answer from — FAQs, policies,
        pricing, hours. The embedded widget only ever answers from what&apos;s
        here.
      </p>

      {!agentId ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <p className="font-body text-sm text-secondary-text">
            No active agent found for your organization yet.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <KnowledgeBaseClient documents={documents} />
        </div>
      )}
    </div>
  );
}
