import { NextResponse } from "next/server";

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function withRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAtSeconds: number,
) {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  response.headers.set("X-RateLimit-Reset", String(resetAtSeconds));
  return response;
}
