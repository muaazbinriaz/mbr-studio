import { Building2, Bot, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/platform/StatCard";

/**
 * Real counts only — no invented numbers. Prompt 03 (guardrails, lead
 * capture, analytics) is what actually populates message-volume /
 * resolution-rate style metrics; until then this page only shows
 * counts of rows that genuinely exist today (organizations, agents,
 * admins), which is honest even while most of the platform is empty.
 */
export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: orgCount }, { count: agentCount }, { count: adminCount }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("*", { count: "exact", head: true }),
      supabase.from("agents").select("*", { count: "exact", head: true }),
      supabase.from("admins").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Overview
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Platform-wide stats — message volume and churn will show up here once
        Prompt 03 lands.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Organizations"
          value={orgCount ?? 0}
          accent="primary"
        />
        <StatCard
          icon={Bot}
          label="Agents"
          value={agentCount ?? 0}
          accent="accent"
        />
        <StatCard
          icon={ShieldCheck}
          label="Admins"
          value={adminCount ?? 0}
          accent="primary"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
        <p className="font-body text-sm text-secondary-text">
          Conversation volume, lead counts, and AI resolution rate will show up
          here once Prompt 03 (guardrails, lead capture, analytics) is
          implemented.
        </p>
      </div>
    </div>
  );
}
