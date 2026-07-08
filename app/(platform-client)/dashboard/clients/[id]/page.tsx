import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // No manual ownership check needed beyond this select — RLS's
  // is_org_accessible() already returns zero rows if this org isn't
  // a sub-client of a reseller org the current user belongs to.
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!org) notFound();

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, embed_keys(public_key)")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { count: docCount } = await supabase
    .from("knowledge_base_documents")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", org.id);

  const { count: convCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", org.id);

  const publicKey = (
    agent?.embed_keys as { public_key: string }[] | undefined
  )?.[0]?.public_key;

  return (
    <div>
      <Link
        href="/dashboard/clients"
        className="mb-4 inline-flex items-center gap-1.5 font-body text-sm text-secondary-text hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {org.name}
        </h1>
        <Badge variant="outline" className="text-xs capitalize">
          {org.status}
        </Badge>
      </div>
      <p className="mt-2 font-body text-sm text-secondary-text">
        slug: {org.slug}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="font-body text-xs text-secondary-text">Agent</p>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            {agent?.name ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="font-body text-xs text-secondary-text">KB documents</p>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            {docCount ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="font-body text-xs text-secondary-text">Conversations</p>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            {convCount ?? 0}
          </p>
        </div>
      </div>

      {publicKey && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="font-body text-xs text-secondary-text">
            Embed public key
          </p>
          <code className="mt-1 block rounded-md bg-background px-2.5 py-1 font-mono text-xs text-secondary-text">
            {publicKey}
          </code>
        </div>
      )}

      <p className="mt-6 font-body text-xs text-secondary-text">
        Note: full knowledge-base editing, guardrails, and the live inbox for
        this client aren&apos;t wired into this view yet — those pages currently
        resolve &quot;your org&quot; from your own membership rather than an
        org-id param. That&apos;s a follow-up routing change, not a data/RLS
        change; the security model here already fully supports it.
      </p>
    </div>
  );
}
