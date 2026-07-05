import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { OrgDetailClient } from "./OrgDetailClient";

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, status, is_reseller, parent_organization_id, reseller_brand_name, reseller_logo_url, reseller_domain, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!org) notFound();

  let subOrgs: { id: string; name: string; slug: string; status: string }[] =
    [];
  if (org.is_reseller) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, slug, status")
      .eq("parent_organization_id", org.id)
      .order("created_at", { ascending: false });
    subOrgs = data ?? [];
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {org.name}
        </h1>
        <Badge variant="outline" className="text-xs capitalize">
          {org.status}
        </Badge>
        {org.is_reseller && <Badge variant="success">Reseller</Badge>}
      </div>
      <p className="mt-2 font-body text-sm text-secondary-text">
        slug: {org.slug}
      </p>

      <div className="mt-8">
        <OrgDetailClient org={org} subOrgs={subOrgs} />
      </div>
    </div>
  );
}
