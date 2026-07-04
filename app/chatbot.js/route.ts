import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * Served dynamically (not from /public) so this can later inject
 * per-request config or a build version, and so the response is
 * explicitly cacheable/versionable rather than a static asset.
 *
 * GET /chatbot.js — this is the literal embed URL:
 *   <script src="https://mbrstudio.dev/chatbot.js" data-client="clx_..." defer></script>
 */

let cachedScript: string | null = null;

function getScript(): string {
  if (cachedScript) return cachedScript;
  cachedScript = readFileSync(
    path.join(process.cwd(), "lib/widget/chatbot-widget-source.js"),
    "utf-8",
  );
  return cachedScript;
}

export async function GET() {
  return new NextResponse(getScript(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
