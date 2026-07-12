import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";
import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import type { GuardrailToggles } from "@/lib/agents/build-system-prompt";

interface LeadCaptureSettings {
  ask_name: boolean;
  ask_email: boolean;
  ask_phone: boolean;
  ask_message: boolean;
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(name, primary_color, accent_color, welcome_message, logo_url, widget_position)",
    )
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  let agentId: string | null = null;
  let agentName = "";
  let publicKey: string | null = null;
  let initialStep = 0;
  let guardrails: GuardrailToggles | null = null;
  let leadCaptureSettings: LeadCaptureSettings | null = null;
  let documents: {
    id: string;
    title: string;
    status: string;
    source_type: string;
    source_url: string | null;
    created_at: string;
    updated_at: string;
    last_refreshed_at: string | null;
    error_message: string | null;
    raw_content: string | null;
    chunkCount: number;
  }[] = [];

  if (membership) {
    const { data: agent } = await supabase
      .from("agents")
      .select(
        "id, name, setup_complete, onboarding_step, embed_keys(public_key)",
      )
      .eq("organization_id", membership.organization_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    // Already set up? Don't let a returning user silently re-run the
    // wizard and overwrite their real settings with template defaults.
    if (agent?.setup_complete) {
      redirect("/dashboard");
    }

    agentId = agent?.id ?? null;
    agentName = agent?.name ?? "";
    initialStep = Math.min(Math.max(agent?.onboarding_step ?? 0, 0), 4);
    const keys = agent?.embed_keys as { public_key: string }[] | undefined;
    publicKey = keys?.[0]?.public_key ?? null;

    if (agentId) {
      const { data: gr } = await supabase
        .from("agent_guardrails")
        .select(
          "no_competitors, stay_on_topic, no_pricing, always_polite, no_opinions, push_contact, no_refund_promise, capture_leads, custom_rules, tone, reply_language, lead_capture_settings",
        )
        .eq("agent_id", agentId)
        .maybeSingle();
      guardrails = gr ?? null;
      leadCaptureSettings =
        (gr?.lead_capture_settings as LeadCaptureSettings) ?? null;

      const { data: docs } = await supabase
        .from("knowledge_base_documents")
        .select(
          "id, title, status, source_type, source_url, created_at, updated_at, last_refreshed_at, error_message, raw_content",
        )
        .eq("agent_id", agentId)
        .order("updated_at", { ascending: false });

      const { data: chunks } = await supabase
        .from("knowledge_base_chunks")
        .select("document_id")
        .eq("agent_id", agentId);

      const chunkCounts = new Map<string, number>();
      for (const c of chunks ?? []) {
        chunkCounts.set(
          c.document_id,
          (chunkCounts.get(c.document_id) ?? 0) + 1,
        );
      }

      documents = (docs ?? []).map((d) => ({
        ...d,
        chunkCount: chunkCounts.get(d.id) ?? 0,
      }));
    }
  }

  const org = membership?.organizations as unknown as {
    name: string;
    primary_color: string;
    accent_color: string;
    welcome_message: string;
    logo_url: string | null;
    widget_position: string;
  } | null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Get set up
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Five quick steps — you&apos;ll see your live widget the whole way
        through.
      </p>
      <div className="mt-8">
        <OnboardingWizard
          org={org}
          agentId={agentId}
          agentName={agentName}
          publicKey={publicKey}
          templates={AGENT_TEMPLATES}
          initialStep={initialStep}
          guardrails={guardrails}
          leadCaptureSettings={leadCaptureSettings}
          documents={documents}
        />
      </div>
    </div>
  );
}
