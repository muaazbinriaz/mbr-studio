import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiRequest } from "@/lib/api/authenticate";
import { apiError, apiSuccess, withRateLimitHeaders } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return apiError(auth.status, auth.code, auth.message);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, agent_type, is_active")
    .eq("organization_id", auth.context.organizationId); // <-- mandatory

  if (error) return apiError(500, "internal_error", "Failed to fetch agents.");

  const response = apiSuccess(data);
  return withRateLimitHeaders(
    response,
    auth.rateLimit.limit,
    auth.rateLimit.remaining,
    auth.rateLimit.resetAtSeconds,
  );
}
