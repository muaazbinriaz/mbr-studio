import { createClient } from "@/lib/supabase/server";
import { ApiKeysClient } from "./ApiKeysClient";
import { maskApiKey } from "@/lib/api/keys";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  let keys: {
    id: string;
    label: string | null;
    created_at: string;
    last_used_at: string | null;
    revoked_at: string | null;
    masked: string;
  }[] = [];

  if (membership) {
    const { data: rows } = await supabase
      .from("api_keys")
      .select("id, label, created_at, last_used_at, revoked_at, key_prefix")
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: false });

    keys = (rows ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      created_at: row.created_at,
      last_used_at: row.last_used_at,
      revoked_at: row.revoked_at,
      masked: maskApiKey(row.key_prefix ?? "sk_live_"),
    }));
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        API Keys
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Use these keys to authenticate requests to the public API.{" "}
        <a
          href="/docs/api"
          className="text-primary underline underline-offset-2"
        >
          View API docs
        </a>
      </p>
      <div className="mt-8">
        <ApiKeysClient keys={keys} />
      </div>
    </div>
  );
}
