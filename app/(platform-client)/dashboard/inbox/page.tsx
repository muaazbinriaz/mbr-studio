import { createClient } from "@/lib/supabase/server";
import { getInboxConversations } from "@/lib/inbox/queries";
import { InboxClient } from "./InboxClient";
import { LockedFeatureEmptyState } from "@/components/platform/LockedFeatureEmptyState";

export default async function InboxPage() {
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

  const organizationId = membership?.organization_id ?? null;

  let setupComplete = false;
  if (organizationId) {
    const { data: agent } = await supabase
      .from("agents")
      .select("setup_complete")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    setupComplete = agent?.setup_complete ?? false;
  }

  const initialConversations =
    organizationId && setupComplete
      ? await getInboxConversations(supabase, organizationId)
      : [];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex-none">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Inbox
        </h1>
        <p className="mt-1 font-body text-sm text-secondary-text">
          Every conversation, across every channel, as it happens.
        </p>
      </div>

      {!organizationId ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <p className="font-body text-sm text-secondary-text">
            No organization found for your account yet.
          </p>
        </div>
      ) : !setupComplete ? (
        <LockedFeatureEmptyState feature="the Inbox" />
      ) : (
        <div className="min-h-0 flex-1">
          <InboxClient
            organizationId={organizationId}
            currentUserId={user?.id ?? null}
            initialConversations={initialConversations}
          />
        </div>
      )}
    </div>
  );
}
