/**
 * Generic in-memory rate limiter, keyed by an arbitrary string.
 *
 * Extracted from lib/chat/rate-limit.ts (Prompt 01/marketing chat) so
 * the widget chat route (Prompt 02) can rate-limit per-organization
 * instead of per-IP, using the same bucket/window mechanics, without
 * two separate implementations drifting apart.
 *
 * Same caveats as before: fine for a single Vercel instance / low-to-
 * moderate traffic. Swap for Upstash Ratelimit (Redis-backed) if
 * traffic grows past what in-memory buckets can reasonably track.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 8;

// Single shared map, keyed like "<namespace>:<id>" (e.g. "chat-ip:1.2.3.4"
// or "widget-org:<uuid>") so different call sites can't collide with
// each other while still sharing one prune interval.
const buckets = new Map<string, Bucket>();

export function checkRateLimitFor(
  key: string,
  {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
  }: RateLimitOptions = {},
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  // Vercel's edge network sets/overwrites these — a client can't spoof
  // them on a real Vercel deployment. Plain x-forwarded-for is kept
  // only as a last-resort fallback for local/non-Vercel environments.
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

let pruneStarted = false;
export function ensureRateLimitPrune() {
  if (pruneStarted) return;
  pruneStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, DEFAULT_WINDOW_MS).unref?.();
}

ensureRateLimitPrune();
