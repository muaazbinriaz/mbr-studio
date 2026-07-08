import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";
import { AGENT_TEMPLATES } from "@/lib/agents/templates";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(name, primary_color, accent_color, welcome_message, logo_url)",
    )
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  let agentId: string | null = null;
  let publicKey: string | null = null;

  if (membership) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id, setup_complete, embed_keys(public_key)")
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
    const keys = agent?.embed_keys as { public_key: string }[] | undefined;
    publicKey = keys?.[0]?.public_key ?? null;
  }

  const org = membership?.organizations as unknown as {
    name: string;
    primary_color: string;
    accent_color: string;
    welcome_message: string;
    logo_url: string | null;
  } | null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Get set up
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Four quick steps to get your AI agent live on your website.
      </p>
      <div className="mt-8">
        <OnboardingWizard
          org={org}
          agentId={agentId}
          publicKey={publicKey}
          templates={AGENT_TEMPLATES}
        />
      </div>
    </div>
  );
}
