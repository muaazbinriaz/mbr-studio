import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddClientForm } from "./AddClientForm";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(is_reseller)")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    is_reseller: boolean;
  } | null;
  const isReseller = !!org?.is_reseller;

  let clients: {
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
  }[] = [];
  if (isReseller && membership) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, slug, status, created_at")
      .eq("parent_organization_id", membership.organization_id)
      .order("created_at", { ascending: false });
    clients = data ?? [];
  }

  if (!isReseller) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Clients
        </h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <p className="font-body text-sm text-secondary-text">
            Reseller mode isn&apos;t enabled for your organization. Contact MBR
            Studio if you&apos;d like to resell this platform under your own
            brand.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Clients
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Your sub-clients — each gets their own agent, knowledge base, and inbox,
        fully isolated from MBR Studio&apos;s direct clients and other
        resellers.
      </p>

      <div className="mt-6">
        <AddClientForm />
      </div>

      <div className="mt-8">
        {clients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
            <p className="font-body text-sm text-secondary-text">
              No clients yet — add your first one above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {client.name}
                    </p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {client.status}
                    </Badge>
                  </div>
                  <p className="mt-1 font-body text-xs text-secondary-text">
                    slug: {client.slug}
                  </p>
                </div>
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="font-body text-xs font-medium text-primary hover:text-accent"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
