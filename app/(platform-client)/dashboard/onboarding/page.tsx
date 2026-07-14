import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";
import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import type { GuardrailToggles } from "@/lib/agents/build-system-prompt";
import { getCurrentOrg } from "@/lib/auth/current-org";

interface LeadCaptureSettings {
  ask_name: boolean;
  ask_email: boolean;
  ask_phone: boolean;
  ask_message: boolean;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepOverride } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgResult = user ? await getCurrentOrg(supabase, user.id) : null;
  const membership = orgResult
    ? { organization_id: orgResult.active.organizationId }
    : null;

  const { data: orgRow } = orgResult
    ? await supabase
        .from("organizations")
        .select(
          "name, primary_color, accent_color, welcome_message, logo_url, widget_position",
        )
        .eq("id", orgResult.active.organizationId)
        .maybeSingle()
    : { data: null };

  let agentId: string | null = null;
  let agentName = "";
  let publicKey: string | null = null;
  let initialStep = 0;
  let alreadyLive = false;
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
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    agentId = agent?.id ?? null;
    agentName = agent?.name ?? "";
    initialStep = Math.min(Math.max(agent?.onboarding_step ?? 0, 0), 4);

    // Deep-link support — e.g. the Overview checklist's "Set up
    // guardrails and tone" links here with ?step=2. Only ever honored
    // if the user has genuinely reached that step or further — never
    // skips them ahead of steps they haven't actually done, which
    // would show earlier steps as falsely "completed" (checkmarked)
    // in the progress bar. A user who's behind gets sent to their
    // real current step instead; they'll reach Behavior naturally.
    const parsedStep = Number(stepOverride);
    if (Number.isInteger(parsedStep) && parsedStep >= 0 && parsedStep <= 4) {
      initialStep = Math.min(parsedStep, initialStep);
    }
    alreadyLive = agent?.setup_complete ?? false;
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

  const org = orgRow as {
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
