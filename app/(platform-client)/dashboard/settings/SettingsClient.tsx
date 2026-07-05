"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  Copy,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
} from "lucide-react";

import { setPrimaryDomain, checkDomainNow } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OrgDomainInfo = {
  primary_domain: string | null;
  domain_verify_token: string | null;
  domain_verify_status: string;
  domain_verified_at: string | null;
  domain_grace_started_at: string | null;
} | null;

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  verified: "success",
  pending: "warning",
  suspended: "outline",
};

export function SettingsClient({ org }: { org: OrgDomainInfo }) {
  const [domain, setDomain] = useState(org?.primary_domain ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recordName = org?.primary_domain
    ? `_mbrstudio-verify.${org.primary_domain}`
    : null;
  const recordValue = org?.domain_verify_token
    ? `mbrstudio-verify=${org.domain_verify_token}`
    : null;
  const inGrace =
    Boolean(org?.domain_grace_started_at) &&
    org?.domain_verify_status === "verified";

  const handleSaveDomain = () => {
    setError(null);
    const formData = new FormData();
    formData.set("domain", domain);
    startTransition(async () => {
      const result = await setPrimaryDomain(formData);
      if (result?.error) setError(result.error);
    });
  };

  const handleCheckNow = () => {
    setError(null);
    setCheckResult(null);
    startTransition(async () => {
      const result = await checkDomainNow();
      if (result?.error) {
        setError(result.error);
      } else {
        setCheckResult(result.status ?? null);
      }
    });
  };

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Your domain
        </h2>
        <p className="mb-4 font-body text-sm text-secondary-text">
          The domain your chat widget will be embedded on.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourbusiness.com"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button onClick={handleSaveDomain} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Save domain
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 font-body text-sm text-error">
            {error}
          </p>
        )}
      </div>

      {org?.primary_domain && recordName && recordValue && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Verification
            </h2>
            <Badge
              variant={STATUS_VARIANT[org.domain_verify_status] ?? "outline"}
              className="capitalize"
            >
              {org.domain_verify_status}
            </Badge>
          </div>

          {inGrace && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 font-body text-xs text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span>
                Your TXT record was not found on the last check. It&apos;s still
                working for now (7-day grace period), but please make sure the
                record below is still in place.
              </span>
            </div>
          )}

          <p className="mb-2 font-body text-sm text-foreground">
            Add this TXT record to your domain&apos;s DNS settings:
          </p>
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2.5">
            <div className="min-w-0">
              <p className="font-body text-xs text-secondary-text">
                Name / Host
              </p>
              <code className="block truncate font-mono text-xs text-foreground">
                {recordName}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyValue(recordName)}
              className="flex-none rounded-md p-1.5 text-secondary-text hover:bg-card hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2.5">
            <div className="min-w-0">
              <p className="font-body text-xs text-secondary-text">Value</p>
              <code className="block truncate font-mono text-xs text-foreground">
                {recordValue}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyValue(recordValue)}
              className="flex-none rounded-md p-1.5 text-secondary-text hover:bg-card hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {copied && (
            <p className="mb-3 font-body text-xs text-success">Copied.</p>
          )}

          <Button
            onClick={handleCheckNow}
            disabled={isPending}
            variant="outline"
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}
            Check now
          </Button>

          {checkResult && (
            <p className="mt-3 flex items-center gap-1.5 font-body text-sm text-foreground">
              {checkResult === "verified" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              Result:{" "}
              <span className="font-medium capitalize">{checkResult}</span>
            </p>
          )}

          <p className="mt-4 font-body text-xs text-secondary-text">
            DNS changes can take up to 24-48 hours to propagate. Until verified,
            your widget will still work on any domain — verification adds a
            layer of security once it&apos;s live.
          </p>
        </div>
      )}
    </div>
  );
}
