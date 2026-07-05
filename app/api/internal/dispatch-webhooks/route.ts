import { NextRequest, NextResponse } from "next/server";
import { dispatchPendingWebhooks } from "@/lib/webhooks/dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Triggered by Vercel Cron (see vercel.json) every minute. Protected
 * by a shared secret header — Vercel Cron sends this automatically
 * via the `Authorization: Bearer <CRON_SECRET>` header when
 * CRON_SECRET env var is set, OR you can hit this manually for
 * testing with the same header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_DISPATCH_SECRET}`;

  if (!process.env.CRON_DISPATCH_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchPendingWebhooks();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[dispatch-webhooks] failed:", err);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
