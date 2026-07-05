"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleReseller, saveResellerBranding } from "../actions";

interface OrgDetail {
  id: string;
  is_reseller: boolean;
  reseller_brand_name: string | null;
  reseller_logo_url: string | null;
  reseller_domain: string | null;
}

export function OrgDetailClient({
  org,
  subOrgs,
}: {
  org: OrgDetail;
  subOrgs: { id: string; name: string; slug: string; status: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(org.reseller_brand_name ?? "");
  const [logoUrl, setLogoUrl] = useState(org.reseller_logo_url ?? "");
  const [domain, setDomain] = useState(org.reseller_domain ?? "");

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleReseller(org.id, !org.is_reseller);
      if (result?.error) setError(result.error);
    });
  };

  const handleSaveBranding = () => {
    setError(null);
    const formData = new FormData();
    formData.set("reseller_brand_name", brandName);
    formData.set("reseller_logo_url", logoUrl);
    formData.set("reseller_domain", domain);
    startTransition(async () => {
      const result = await saveResellerBranding(org.id, formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Reseller status
        </h2>
        <p className="mb-4 font-body text-xs text-secondary-text">
          Turning this on lets this org onboard sub-clients at
          /dashboard/clients and see everything Prompts 01–05 built, scoped to
          their own sub-clients only.
        </p>
        <Button onClick={handleToggle} disabled={isPending} variant="outline">
          {isPending && <Loader2 className="animate-spin" />}
          {org.is_reseller ? "Disable reseller mode" : "Enable reseller mode"}
        </Button>
      </div>

      {org.is_reseller && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
            White-label branding
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-sm font-medium text-foreground">
                Brand name
              </label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Acme Agency"
                className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-sm font-medium text-foreground">
                Logo URL
              </label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="font-body text-sm font-medium text-foreground">
                Custom domain{" "}
                <span className="text-secondary-text">(optional)</span>
              </label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="app.acmeagency.com"
                className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 font-body text-sm text-error">{error}</p>
          )}
          <Button
            onClick={handleSaveBranding}
            disabled={isPending}
            className="mt-4"
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save branding
          </Button>
        </div>
      )}

      {org.is_reseller && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
            Sub-clients ({subOrgs.length})
          </h2>
          {subOrgs.length === 0 ? (
            <p className="font-body text-sm text-secondary-text">
              No sub-clients yet — this reseller can add them at
              /dashboard/clients.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {subOrgs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="font-body text-sm text-foreground">
                    {sub.name}
                  </span>
                  <Link
                    href={`/admin/organizations/${sub.id}`}
                    className="font-body text-xs text-primary hover:text-accent"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
