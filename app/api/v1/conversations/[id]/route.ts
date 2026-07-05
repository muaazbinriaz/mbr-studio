import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api/authenticate";
import { apiError, apiSuccess, withRateLimitHeaders } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return apiError(auth.status, auth.code, auth.message);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(
      "id, channel, visitor_id, visitor_display_name, status, started_at, last_message_at",
    )
    .eq("id", id)
    .eq("organization_id", auth.context.organizationId) // <-- mandatory
    .maybeSingle();

  if (error || !conversation)
    return apiError(404, "not_found", "Conversation not found.");

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .eq("organization_id", auth.context.organizationId) // <-- mandatory, defense in depth
    .order("created_at", { ascending: true });

  const response = apiSuccess({ ...conversation, messages: messages ?? [] });
  return withRateLimitHeaders(
    response,
    auth.rateLimit.limit,
    auth.rateLimit.remaining,
    auth.rateLimit.resetAtSeconds,
  );
}
