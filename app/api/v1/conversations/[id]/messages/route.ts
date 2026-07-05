import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api/authenticate";
import { apiError, apiSuccess, withRateLimitHeaders } from "@/lib/api/response";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return apiError(auth.status, auth.code, auth.message);

  const { id } = await params;
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success)
    return apiError(400, "invalid_query", "Invalid query parameters.");
  const { page, limit } = parsed.data;

  const supabase = createAdminClient();

  // Confirm the conversation belongs to this org before returning messages.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .eq("organization_id", auth.context.organizationId) // <-- mandatory
    .maybeSingle();

  if (!conversation)
    return apiError(404, "not_found", "Conversation not found.");

  const from = (page - 1) * limit;
  const {
    data: messages,
    count,
    error,
  } = await supabase
    .from("messages")
    .select("id, role, content, created_at", { count: "exact" })
    .eq("conversation_id", id)
    .eq("organization_id", auth.context.organizationId) // <-- mandatory
    .order("created_at", { ascending: true })
    .range(from, from + limit - 1);

  if (error)
    return apiError(500, "internal_error", "Failed to fetch messages.");

  const response = apiSuccess(messages, { page, limit, total: count ?? 0 });
  return withRateLimitHeaders(
    response,
    auth.rateLimit.limit,
    auth.rateLimit.remaining,
    auth.rateLimit.resetAtSeconds,
  );
}
