import { createClient } from "@/lib/supabase/server";
import { CreateOrganizationForm } from "./CreateOrganizationForm";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminOrganizationsPage() {
  const supabase = await createClient();

  const { data: organizations, error } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, status, plan, created_at, agents(id, name, embed_keys(public_key))",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Organizations
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Every client on the platform. Creating one here also creates a default
        agent and embed key, ready for Prompt 02&apos;s widget.
      </p>

      <div className="mt-6">
        <CreateOrganizationForm />
      </div>

      {error && (
        <p className="mt-6 font-body text-sm text-error">{error.message}</p>
      )}

      <div className="mt-8">
        {!organizations || organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
            <p className="font-body text-sm text-secondary-text">
              No organizations yet — create your first test organization above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {organizations.map((org) => {
              const agent = org.agents?.[0] as
                | {
                    id: string;
                    name: string;
                    embed_keys: { public_key: string }[];
                  }
                | undefined;
              const publicKey = agent?.embed_keys?.[0]?.public_key;

              return (
                <div
                  key={org.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-heading text-sm font-semibold text-foreground">
                        {org.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="flex-none text-xs capitalize"
                      >
                        {org.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate font-body text-xs text-secondary-text">
                      slug: {org.slug}
                      {agent && ` · agent: ${agent.name}`}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    {publicKey && (
                      <code className="w-fit max-w-full truncate rounded-md bg-background px-2.5 py-1 font-mono text-xs text-secondary-text">
                        {publicKey}
                      </code>
                    )}
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="flex-none font-body text-xs text-primary hover:text-accent"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
