import { Building2, MessageSquare, Users, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/platform/StatCard";
import { Badge } from "@/components/ui/badge";
import { AnalyticsChart } from "@/components/platform/AnalyticsChart";
import { getOrgAnalyticsSummary } from "@/lib/analytics/queries";

export default async function ClientOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name, status)")
    .eq("user_id", user?.id ?? "");

  const orgCount = memberships?.length ?? 0;
  const primaryOrgId = memberships?.[0]?.organization_id as string | undefined;

  const analytics = primaryOrgId
    ? await getOrgAnalyticsSummary(supabase, primaryOrgId, 30)
    : null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Overview
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Real-time stats from your AI agent&apos;s conversations.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          label="Conversations (30d)"
          value={analytics?.totalConversations ?? 0}
          accent="primary"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages (30d)"
          value={analytics?.totalMessages ?? 0}
          accent="accent"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved by AI"
          value={
            analytics ? `${Math.round(analytics.resolutionRate * 100)}%` : "0%"
          }
          accent="primary"
        />
        <StatCard
          icon={Users}
          label="Unique visitors (30d)"
          value={analytics?.uniqueVisitors ?? 0}
          accent="accent"
        />
      </div>

      {analytics && (
        <div className="mt-6">
          <AnalyticsChart data={analytics.daily} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          label={orgCount === 1 ? "Organization" : "Organizations"}
          value={orgCount}
          accent="primary"
        />
      </div>

      {!memberships || memberships.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <p className="font-body text-sm text-secondary-text">
            You&apos;re not attached to an organization yet. Once MBR Studio
            adds you as a member, your agent&apos;s data will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {memberships.map((m, i) => {
            const org = m.organizations as unknown as {
              name: string;
              status: string;
            } | null;
            return (
              <div
                key={i}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors duration-200 hover:border-primary/40"
              >
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {org?.name}
                  </p>
                  <p className="mt-1 font-body text-xs capitalize text-secondary-text">
                    {m.role}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {org?.status}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
