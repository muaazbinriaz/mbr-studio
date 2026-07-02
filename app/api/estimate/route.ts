import { NextResponse } from "next/server";
import { z } from "zod";

const estimateSchema = z.object({
  serviceType: z.enum([
    "digital-product-development",
    "ai-business-automation",
    "whatsapp-automation",
    "landing-pages",
    "saas-development",
    "ui-ux-design",
  ]),
  scope: z.enum(["basic", "standard", "advanced"]),
  timeline: z.enum(["standard", "expedited"]),
});

// Rough base ranges in USD — refine with real pricing in Blueprint Part 2.
const BASE_RANGES: Record<string, [number, number]> = {
  "digital-product-development": [3000, 12000],
  "ai-business-automation": [2500, 9000],
  "whatsapp-automation": [1500, 6000],
  "landing-pages": [800, 3000],
  "saas-development": [8000, 40000],
  "ui-ux-design": [1500, 6000],
};

const SCOPE_MULTIPLIER: Record<string, number> = {
  basic: 0.8,
  standard: 1,
  advanced: 1.6,
};

const TIMELINE_MULTIPLIER: Record<string, number> = {
  standard: 1,
  expedited: 1.25,
};

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = estimateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { serviceType, scope, timeline } = parsed.data;
  const [baseLow, baseHigh] = BASE_RANGES[serviceType];
  const multiplier = SCOPE_MULTIPLIER[scope] * TIMELINE_MULTIPLIER[timeline];

  const low = Math.round((baseLow * multiplier) / 100) * 100;
  const high = Math.round((baseHigh * multiplier) / 100) * 100;

  return NextResponse.json({ low, high, currency: "USD" });
}
