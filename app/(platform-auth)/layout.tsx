import type { Metadata } from "next";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthSplitLayout } from "@/components/platform/AuthSplitLayout";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get("host")?.split(":")[0] ?? "";

  let resellerBrand: { name: string; logoUrl: string | null } | null = null;

  if (host) {
    const supabase = createAdminClient();
    const { data: reseller } = await supabase
      .from("organizations")
      .select("reseller_brand_name, reseller_logo_url")
      .eq("reseller_domain", host)
      .eq("is_reseller", true)
      .maybeSingle();

    if (reseller?.reseller_brand_name) {
      resellerBrand = {
        name: reseller.reseller_brand_name,
        logoUrl: reseller.reseller_logo_url,
      };
    }
  }

  return (
    <AuthSplitLayout resellerBrand={resellerBrand}>{children}</AuthSplitLayout>
  );
}
