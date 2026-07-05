import { NextRequest, NextResponse } from "next/server";
import { verifyOrganizationDomain } from "@/lib/domain-verify/verify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get("org");
  if (!organizationId) {
    return NextResponse.json({ error: "Missing org param." }, { status: 400 });
  }

  const result = await verifyOrganizationDomain(organizationId);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
