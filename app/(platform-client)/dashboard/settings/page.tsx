import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(primary_domain, domain_verify_token, domain_verify_status, domain_verified_at, domain_grace_started_at)",
    )
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    primary_domain: string | null;
    domain_verify_token: string | null;
    domain_verify_status: string;
    domain_verified_at: string | null;
    domain_grace_started_at: string | null;
  } | null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Settings
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Verify your domain so your chat widget only responds where it&apos;s
        supposed to.
      </p>
      <div className="mt-8">
        <SettingsClient org={org} />
      </div>
    </div>
  );
}
