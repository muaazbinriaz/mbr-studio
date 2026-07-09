import { NextResponse } from "next/server";
import { verifyOrganizationDomain } from "@/lib/domain-verify/verify";
import { getCurrentOrgId } from "@/lib/auth/actions";

export const runtime = "nodejs";

export async function GET() {
  const organizationId = await getCurrentOrgId();
  if (!organizationId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const result = await verifyOrganizationDomain(organizationId);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
