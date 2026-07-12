import { createClient } from "@/lib/supabase/server";
import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import { TemplatesClient } from "./TemplatesClient";
import { LockedFeatureEmptyState } from "@/components/platform/LockedFeatureEmptyState";
import { getCurrentOrg } from "@/lib/auth/current-org";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgResult = await getCurrentOrg(supabase, user?.id ?? "");
  const membership = orgResult
    ? { organization_id: orgResult.active.organizationId }
    : null;

  let setupComplete = false;
  if (membership) {
    const { data: agent } = await supabase
      .from("agents")
      .select("setup_complete")
      .eq("organization_id", membership.organization_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    setupComplete = agent?.setup_complete ?? false;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Industry Templates
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Apply a template to instantly set up guardrails, starter FAQs, and
        greeting chips for your industry. You can edit everything afterward — a
        template is a starting point, not a lock-in.
      </p>
      <div className="mt-8">
        {setupComplete ? (
          <TemplatesClient templates={AGENT_TEMPLATES} />
        ) : (
          <LockedFeatureEmptyState feature="Industry Templates" />
        )}
      </div>
    </div>
  );
}
