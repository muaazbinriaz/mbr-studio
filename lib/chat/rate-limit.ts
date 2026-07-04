import { checkRateLimitFor, getClientIp as _getClientIp } from "@/lib/rate-limit";

/**
 * Thin, IP-keyed wrapper around the shared limiter in lib/rate-limit.ts.
 * Kept as its own module — with the exact same exports as before —
 * so app/api/chat/route.ts's existing
 * `import { checkRateLimit, getClientIp } from "@/lib/chat/rate-limit"`
 * keeps working unchanged. The widget chat route (Prompt 02) calls
 * checkRateLimitFor() directly with an org-scoped key instead of
 * going through this file.
 */

const CHAT_WINDOW_MS = 60_000; // 1 minute window
const CHAT_MAX_REQUESTS = 8; // max messages per window per IP

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  return checkRateLimitFor(`chat-ip:${ip}`, {
    windowMs: CHAT_WINDOW_MS,
    maxRequests: CHAT_MAX_REQUESTS,
  });
}

export const getClientIp = _getClientIp;
