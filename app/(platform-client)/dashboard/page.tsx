import { redirect } from "next/navigation";
import Link from "next/link";
import {
  GettingStartedChecklist,
  type ChecklistItem,
} from "@/components/platform/GettingStartedChecklist";
import { PLANS } from "@/lib/billing/plans";
import { PlanLimitBanner } from "@/components/platform/PlanLimitBanner";
import { Building2, MessageSquare, Users, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/platform/StatCard";
import { Badge } from "@/components/ui/badge";
import { AnalyticsChart } from "@/components/platform/AnalyticsChart";
import {
  getOrgAnalyticsSummary,
  getPreviousPeriodSummary,
} from "@/lib/analytics/queries";

type Organization = {
  name: string;
  status: string;
  monthly_message_limit: number;
};

export default async function ClientOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("organization_members")
    .select(
      "organization_id, role, organizations(name, status, monthly_message_limit)",
    )
    .eq("user_id", user?.id ?? "");

  const orgCount = memberships?.length ?? 0;
  const primaryOrgId = memberships?.[0]?.organization_id as string | undefined;
  const primaryOrg = memberships?.[0]
    ?.organizations as unknown as Organization | null;

  // Naye users ko wizard tak bhejo jab tak setup complete na ho.
  // markOnboardingComplete() wizard ke last step pe ye flag true karta hai.
  if (primaryOrgId) {
    const { data: activeAgent } = await supabase
      .from("agents")
      .select("setup_complete")
      .eq("organization_id", primaryOrgId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (activeAgent && activeAgent.setup_complete === false) {
      redirect("/dashboard/onboarding");
    }
  }

  const { count: messagesThisMonth } = primaryOrgId
    ? await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", primaryOrgId)
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          ).toISOString(),
        )
    : { count: 0 };

  const [analytics, previousPeriod] = primaryOrgId
    ? await Promise.all([
        getOrgAnalyticsSummary(supabase, primaryOrgId, 30),
        getPreviousPeriodSummary(supabase, primaryOrgId, 30),
      ])
    : [null, null];

  function trendFor(
    current: number,
    previous: number | undefined,
  ): number | null {
    if (!previous) return null; // nothing to compare against yet
    return ((current - previous) / previous) * 100;
  }

  // Getting-started checklist data — each condition is checked against
  // real data, except the embed-code one (Prompt 14, Section 3.2).
  let checklistItems: ChecklistItem[] = [];
  if (primaryOrgId) {
    const [
      { count: kbCount },
      { data: guardrailsRow },
      { data: fullOrg },
      { data: activeAgent2 },
    ] = await Promise.all([
      supabase
        .from("knowledge_base_documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", primaryOrgId),
      supabase
        .from("agent_guardrails")
        .select("agent_id")
        .eq(
          "agent_id",
          (
            await supabase
              .from("agents")
              .select("id")
              .eq("organization_id", primaryOrgId)
              .eq("is_active", true)
              .limit(1)
              .maybeSingle()
          ).data?.id ?? "",
        )
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("primary_color, accent_color, welcome_message, logo_url, plan")
        .eq("id", primaryOrgId)
        .maybeSingle(),
      supabase
        .from("agents")
        .select("embed_added_self_reported")
        .eq("organization_id", primaryOrgId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    const brandingChanged =
      fullOrg &&
      (fullOrg.primary_color !== "#6366f1" ||
        fullOrg.accent_color !== "#06b6d4" ||
        fullOrg.welcome_message !== "Hi! How can I help you today?" ||
        !!fullOrg.logo_url);

    const planChannels =
      PLANS[(fullOrg?.plan as keyof typeof PLANS) ?? "starter"]?.channels ?? [];

    checklistItems = [
      {
        key: "kb",
        label: "Add your first knowledge base document",
        href: "/dashboard/knowledge-base",
        done: (kbCount ?? 0) > 0,
      },
      {
        key: "guardrails",
        label: "Customize your guardrails and tone",
        href: "/dashboard/agent/guardrails",
        done: !!guardrailsRow,
      },
      {
        key: "branding",
        label: "Set your branding",
        href: "/dashboard/appearance",
        done: !!brandingChanged,
      },
      {
        key: "embed",
        label: "Copy your embed code and add it to your website",
        href: "/dashboard/onboarding",
        done: !!activeAgent2?.embed_added_self_reported,
        selfReported: true,
      },
    ];

    if (planChannels.length > 1) {
      const { count: channelCount } = await supabase
        .from("channel_connections")
        .select("id", { count: "exact", head: true })
        .eq("status", "connected");
      checklistItems.push({
        key: "optional_channel",
        label: "Connect a messaging channel",
        href: "/dashboard/channels",
        done: (channelCount ?? 0) > 0,
      });
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Overview
      </h1>

      {/*
        Hierarchy: the checklist is an ONBOARDING task (neutral card,
        no color wash) and sits first because activation beats upsell.
        PlanLimitBanner is a COMMERCIAL nudge — a slimmer, color-coded
        strip below so the two never compete for the same visual weight.
      */}
      {checklistItems.length > 0 && (
        <GettingStartedChecklist items={checklistItems} />
      )}

      <PlanLimitBanner
        status={primaryOrg?.status ?? "trial"}
        monthlyMessageLimit={primaryOrg?.monthly_message_limit ?? 500}
        messagesThisMonth={messagesThisMonth ?? 0}
      />

      <p className="mt-2 font-body text-sm text-secondary-text">
        Real-time stats from your AI agent&apos;s conversations.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          label="Conversations (30d)"
          value={analytics?.totalConversations ?? 0}
          accent="primary"
          trend={
            analytics
              ? trendFor(
                  analytics.totalConversations,
                  previousPeriod?.totalConversations,
                )
              : undefined
          }
        />
        <StatCard
          icon={MessageSquare}
          label="Messages (30d)"
          value={analytics?.totalMessages ?? 0}
          accent="accent"
          trend={
            analytics
              ? trendFor(analytics.totalMessages, previousPeriod?.totalMessages)
              : undefined
          }
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved by AI (of conversations)"
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
          trend={
            analytics
              ? trendFor(
                  analytics.uniqueVisitors,
                  previousPeriod?.uniqueVisitors,
                )
              : undefined
          }
        />
      </div>

      {analytics && (
        <div className="mt-6">
          <AnalyticsChart data={analytics.daily} />
        </div>
      )}

      {(analytics?.totalConversations ?? 0) === 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-base font-semibold text-foreground">
            What to do next
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/knowledge-base"
              className="rounded-xl border border-border p-4 text-sm text-foreground transition-colors hover:border-primary/40"
            >
              Add more to your knowledge base
            </Link>
            <Link
              href="/dashboard/agent/guardrails"
              className="rounded-xl border border-border p-4 text-sm text-foreground transition-colors hover:border-primary/40"
            >
              Customize your guardrails
            </Link>
            <Link
              href="/dashboard/onboarding"
              className="rounded-xl border border-border p-4 text-sm text-foreground transition-colors hover:border-primary/40"
            >
              Copy your embed code
            </Link>
          </div>
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
