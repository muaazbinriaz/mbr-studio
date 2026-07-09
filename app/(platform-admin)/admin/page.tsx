import {
  Building2,
  Bot,
  ShieldCheck,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/platform/StatCard";
import { getAdminPlatformSummary } from "@/lib/analytics/queries";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: orgCount },
    { count: agentCount },
    { count: adminCount },
    platform,
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }),
    supabase.from("admins").select("*", { count: "exact", head: true }),
    getAdminPlatformSummary(supabase),
  ]);
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Overview
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Platform-wide stats across every client organization.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
        <StatCard
          icon={MessageSquare}
          label="Conversations (this month)"
          value={platform.totalConversationsThisMonth}
          accent="accent"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages (this month)"
          value={platform.totalMessagesThisMonth}
          accent="primary"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <p className="font-heading text-sm font-semibold text-foreground">
            Most active clients (this month)
          </p>
        </div>

        {platform.leaderboard.length === 0 ? (
          <p className="font-body text-sm text-secondary-text">
            No conversation activity yet this month.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {platform.leaderboard.map((row, i) => (
              <div
                key={row.organizationId}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/10 font-body text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="font-body text-sm text-foreground">
                    {row.name}
                  </span>
                </div>
                <span className="font-body text-sm font-medium text-secondary-text">
                  {row.conversations} conversations
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
