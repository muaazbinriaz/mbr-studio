/**
 * Minimal in-memory rate limiter, keyed by IP.
 *
 * Good enough for low-to-moderate traffic on a single Vercel instance.
 * NOTE: on serverless, in-memory state can reset between cold starts and
 * isn't shared across regions/instances, so this is a soft limiter, not a
 * hard guarantee. If traffic grows, swap this for Upstash Ratelimit
 * (Redis-backed) — same call signature, drop-in replacement.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQUESTS = 8; // max messages per window per IP

const buckets = new Map<string, Bucket>();

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Periodically clear stale buckets so the Map doesn't grow unbounded
// on long-lived instances.
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(ip);
  }
}, WINDOW_MS).unref?.();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
