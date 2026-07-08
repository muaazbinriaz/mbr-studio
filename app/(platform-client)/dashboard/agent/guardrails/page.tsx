import { createClient } from "@/lib/supabase/server";
import { GuardrailsClient } from "./GuardrailsClient";
import type { GuardrailToggles } from "@/lib/agents/build-system-prompt";

interface LeadCaptureSettings {
  ask_name: boolean;
  ask_email: boolean;
  ask_phone: boolean;
  ask_message: boolean;
}

export default async function GuardrailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  let agentId: string | null = null;
  let guardrails: GuardrailToggles | null = null;
  let leadCaptureSettings: LeadCaptureSettings | null = null;

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
    }
  }

  const orgRecord = membership?.organizations as unknown as {
    name: string;
  } | null;
  const orgName = orgRecord?.name ?? "Your Business";

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Guardrails
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Control how your AI agent behaves — what it will and won&apos;t say, its
        tone, and its reply language.
      </p>

      {!agentId ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <p className="font-body text-sm text-secondary-text">
            Setting up your AI agent... this usually takes just a second.
            Refresh if this doesn&apos;t clear in a moment.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <GuardrailsClient
            guardrails={guardrails}
            leadCaptureSettings={leadCaptureSettings}
            orgName={orgName}
          />
        </div>
      )}
    </div>
  );
}
