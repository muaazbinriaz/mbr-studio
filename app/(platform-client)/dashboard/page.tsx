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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(id, name, status, monthly_message_limit, plan, is_reseller)",
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-20 text-center">
        <p className="font-body text-sm text-secondary-text">
          You’re not a member of any organization yet. Please contact support.
        </p>
      </div>
    );
  }

  const org = membership.organizations as unknown as {
    id: string;
    name: string;
    status: string;
    monthly_message_limit: number;
    plan: string;
    is_reseller: boolean;
  };

  const orgId = membership.organization_id;

  const { data: agent } = await supabase
    .from("agents")
    .select("id, setup_complete, onboarding_step, embed_added_self_reported")
    .eq("organization_id", orgId)
    .eq("is_active", true)
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
      key: "add_knowledge",
      label: "Add your first knowledge base document",
      href: "/dashboard/knowledge-base",
      done: kbDocCount > 0,
    },
    {
      key: "embed_widget",
      label: "Embed the chat widget on your site",
      href: "/dashboard/onboarding",
      done: agent?.embed_added_self_reported ?? false,
      selfReported: true,
    },
    {
      key: "set_guardrails",
      label: "Set up guardrails and tone",
      href: "/dashboard/agent/guardrails",
      done: guardrailsRow,
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

      <h1 className="font-heading text-2xl font-bold text-foreground">
        Welcome, {org.name}
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Your AI agent is {org.status === "active" ? "live" : "in trial mode"}.
        Track performance below.
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
        />
        <StatCard
          icon={MessageCircle}
          label="Messages"
          value={current.totalMessages}
          trend={trend(current.totalMessages, previous.totalMessages)}
        />
        <StatCard
          icon={Users}
          label="Unique visitors"
          value={current.uniqueVisitors}
          trend={trend(current.uniqueVisitors, previous.uniqueVisitors)}
        />
        <StatCard
          icon={CheckCircle}
          label="Resolution rate"
          value={`${Math.round(current.resolutionRate * 100)}%`}
          trend={null}
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
