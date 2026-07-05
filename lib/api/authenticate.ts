import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/api/keys";
import { checkRateLimitFor } from "@/lib/rate-limit";

export interface AuthenticatedApiContext {
  organizationId: string;
  apiKeyId: string;
}

const API_RATE_WINDOW_MS = 60_000;
const API_MAX_REQUESTS_PER_MINUTE = 100;

export async function authenticateApiRequest(req: NextRequest): Promise<
  | {
      ok: true;
      context: AuthenticatedApiContext;
      rateLimit: { limit: number; remaining: number; resetAtSeconds: number };
    }
  | { ok: false; status: number; code: string; message: string }
> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      code: "missing_api_key",
      message: "Missing Authorization: Bearer <key> header.",
    };
  }

  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey) {
    return {
      ok: false,
      status: 401,
      code: "missing_api_key",
      message: "Missing API key.",
    };
  }

  const keyHash = hashApiKey(rawKey);
  const supabase = createAdminClient();

  const { data: apiKeyRow } = await supabase
    .from("api_keys")
    .select("id, organization_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!apiKeyRow || apiKeyRow.revoked_at) {
    return {
      ok: false,
      status: 401,
      code: "invalid_api_key",
      message: "Invalid or revoked API key.",
    };
  }

  // Rate limit per API key
  const { allowed, retryAfterSeconds } = checkRateLimitFor(
    `apikey:${apiKeyRow.id}`,
    {
      windowMs: API_RATE_WINDOW_MS,
      maxRequests: API_MAX_REQUESTS_PER_MINUTE,
    },
  );

  if (!allowed) {
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "Rate limit exceeded. Try again shortly.",
    };
  }

  // Fire-and-forget last-used update
  (async () => {
    try {
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyRow.id);
    } catch {
      // ignore errors silently
    }
  })();

  const resetAtSeconds =
    Math.ceil(Date.now() / 1000) + (retryAfterSeconds ?? 60);

  return {
    ok: true,
    context: {
      organizationId: apiKeyRow.organization_id,
      apiKeyId: apiKeyRow.id,
    },
    rateLimit: {
      limit: API_MAX_REQUESTS_PER_MINUTE,
      remaining: API_MAX_REQUESTS_PER_MINUTE - 1,
      resetAtSeconds,
    },
  };
}
