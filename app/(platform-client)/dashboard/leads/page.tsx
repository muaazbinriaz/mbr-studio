import { createClient } from "@/lib/supabase/server";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
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

  let leads: {
    id: string;
    visitor_name: string | null;
    visitor_email: string | null;
    visitor_phone: string | null;
    notes: string | null;
    captured_at: string;
    conversation_id: string | null;
  }[] = [];

  if (membership) {
    const { data } = await supabase
      .from("leads")
      .select(
        "id, visitor_name, visitor_email, visitor_phone, notes, captured_at, conversation_id",
      )
      .eq("organization_id", membership.organization_id)
      .order("captured_at", { ascending: false });
    leads = data ?? [];
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Leads</h1>
      <p className="mt-2 font-body text-sm text-secondary-text">
        Visitors the AI captured when it couldn&apos;t answer their question
        directly.
      </p>
      <div className="mt-8">
        <LeadsClient leads={leads} />
      </div>
    </div>
  );
}
