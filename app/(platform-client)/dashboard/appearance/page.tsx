import { createClient } from "@/lib/supabase/server";
import { AppearanceClient } from "./AppearanceClient";

export default async function AppearancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "organization_id, organizations(name, primary_color, accent_color, welcome_message, logo_url)",
    )
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    name: string;
    primary_color: string;
    accent_color: string;
    welcome_message: string;
    logo_url: string | null;
  } | null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Appearance
      </h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Customize how your chat widget looks and greets visitors.
      </p>
      <div className="mt-8">
        <AppearanceClient org={org} />
      </div>
    </div>
  );
}
