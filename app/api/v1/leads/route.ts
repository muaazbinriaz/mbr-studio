import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api/authenticate";
import { apiError, apiSuccess, withRateLimitHeaders } from "@/lib/api/response";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  since: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return apiError(auth.status, auth.code, auth.message);

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success)
    return apiError(400, "invalid_query", "Invalid query parameters.");
  const { page, limit, since } = parsed.data;

  const supabase = createAdminClient();
  let query = supabase
    .from("leads")
    .select(
      "id, visitor_name, visitor_email, visitor_phone, notes, captured_at, conversation_id",
      { count: "exact" },
    )
    .eq("organization_id", auth.context.organizationId); // <-- mandatory

  if (since) query = query.gte("captured_at", since);

  const from = (page - 1) * limit;
  query = query
    .order("captured_at", { ascending: false })
    .range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) return apiError(500, "internal_error", "Failed to fetch leads.");

  const response = apiSuccess(data, { page, limit, total: count ?? 0 });
  return withRateLimitHeaders(
    response,
    auth.rateLimit.limit,
    auth.rateLimit.remaining,
    auth.rateLimit.resetAtSeconds,
  );
}
