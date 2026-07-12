import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle,
  MessageCircle,
  MessagesSquare,
  Users,
} from "lucide-react";

import {
  getOrgAnalyticsSummary,
  getPreviousPeriodSummary,
} from "@/lib/analytics/queries";
import { StatCard } from "@/components/platform/StatCard";
import { AnalyticsChart } from "@/components/platform/AnalyticsChart";
import { PlanLimitBanner } from "@/components/platform/PlanLimitBanner";
import {
  GettingStartedChecklist,
  type ChecklistItem,
} from "@/components/platform/GettingStartedChecklist";
import { ResumeOnboardingBanner } from "@/components/platform/ResumeOnboardingBanner";
import { getCurrentOrg } from "@/lib/auth/current-org";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ justLaunched?: string }>;
}) {
  const justLaunched = (await searchParams).justLaunched === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orgResult = await getCurrentOrg(supabase, user.id);

  if (!orgResult) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-20 text-center">
        <p className="font-body text-sm text-secondary-text">
          You’re not a member of any organization yet. Please contact support.
        </p>
      </div>
    );
  }

  const orgId = orgResult.active.organizationId;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, status, monthly_message_limit, plan, is_reseller")
    .eq("id", orgId)
    .maybeSingle();

  const org = orgRow as {
    id: string;
    name: string;
    status: string;
    monthly_message_limit: number;
    plan: string;
    is_reseller: boolean;
  };

  const { data: agent } = await supabase
    .from("agents")
    .select("id, setup_complete, onboarding_step, embed_added_self_reported")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const [current, previous, kbDocCount, guardrailsRow] = await Promise.all([
    getOrgAnalyticsSummary(supabase, orgId, 30),
    getPreviousPeriodSummary(supabase, orgId, 30),
    agent
      ? supabase
          .from("knowledge_base_documents")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", agent.id)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
    agent
      ? supabase
          .from("agent_guardrails")
          .select("agent_id")
          .eq("agent_id", agent.id)
          .maybeSingle()
          .then((r) => !!r.data)
      : Promise.resolve(false),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: messagesThisMonth } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", monthStart.toISOString());

  const messages = messagesThisMonth ?? 0;

  const trend = (currentVal: number, prevVal: number): number | null => {
    if (prevVal === 0) return null;
    return Math.round(((currentVal - prevVal) / prevVal) * 100);
  };

  const checklistItems: ChecklistItem[] = [
    {
      key: "finish_setup",
      label: "Finish the setup wizard",
      href: "/dashboard/onboarding",
      done: agent?.setup_complete ?? false,
      emoji: "🚀",
      hint: "Unlocks your full dashboard — Inbox, Leads, and agent settings",
    },
    {
      key: "add_knowledge",
      label: "Add your first knowledge base document",
      href: "/dashboard/knowledge-base",
      done: kbDocCount > 0,
      emoji: "📚",
      hint: "Teach your agent about your business — website, PDF, or text",
    },
    {
      key: "embed_widget",
      label: "Embed the chat widget on your site",
      href: "/dashboard/onboarding",
      done: agent?.embed_added_self_reported ?? false,
      selfReported: true,
      emoji: "🔗",
      hint: "Copy one snippet into your site's HTML — takes 2 minutes",
    },
    {
      key: "set_guardrails",
      label: "Set up guardrails and tone",
      href: "/dashboard/agent/guardrails",
      done: guardrailsRow,
      emoji: "🛡️",
      hint: "Decide what your agent should and shouldn't say",
    },
  ];

  return (
    <div>
      {agent && !agent.setup_complete && (
        <ResumeOnboardingBanner step={agent.onboarding_step ?? 0} />
      )}

      <PlanLimitBanner
        status={org.status}
        monthlyMessageLimit={org.monthly_message_limit}
        messagesThisMonth={messages}
      />

      {justLaunched && (
        <div className="mb-6 flex flex-col gap-1 rounded-2xl border border-success/30 bg-success/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-base font-semibold text-foreground">
              🎉 Your AI agent is live!
            </p>
            <p className="mt-1 font-body text-sm text-secondary-text">
              This dashboard is now your agent&apos;s control center — use the
              sidebar on the left to manage conversations, retrain it, or change
              how it looks and behaves.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-3xl">👋</span>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Welcome back, {org.name}
        </h1>
      </div>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Your AI agent is{" "}
        <span
          className={
            org.status === "active"
              ? "font-semibold text-success"
              : "font-semibold text-warning"
          }
        >
          {org.status === "active" ? "live" : "in trial mode"}
        </span>
        . Here&apos;s how it&apos;s performing.
      </p>

      <div className="mt-6">
        <GettingStartedChecklist items={checklistItems} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessagesSquare}
          label="Conversations"
          value={current.totalConversations}
          trend={trend(current.totalConversations, previous.totalConversations)}
          emptyHint="No conversations yet — share your widget link"
        />
        <StatCard
          icon={MessageCircle}
          label="Messages"
          value={current.totalMessages}
          trend={trend(current.totalMessages, previous.totalMessages)}
          emptyHint="Your agent hasn't replied to anyone yet"
        />
        <StatCard
          icon={Users}
          label="Unique visitors"
          value={current.uniqueVisitors}
          trend={trend(current.uniqueVisitors, previous.uniqueVisitors)}
          emptyHint="Once live, visitors will show up here"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolution rate"
          value={`${Math.round(current.resolutionRate * 100)}%`}
          trend={null}
          emptyHint="Calculated once you have conversations"
        />
      </div>

      <div className="mt-8">
        <AnalyticsChart data={current.daily} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/knowledge-base"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Manage Knowledge Base
        </Link>
        <Link
          href="/dashboard/inbox"
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 font-body text-sm font-medium text-foreground hover:bg-card"
        >
          <MessagesSquare className="mr-2 h-4 w-4" />
          Go to Inbox
        </Link>
        {org.is_reseller && (
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 font-body text-sm font-medium text-foreground hover:bg-card"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Clients
          </Link>
        )}
      </div>
    </div>
  );
}
