"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { approveBillingRequest, rejectBillingRequest } from "./actions";

interface BillingRequestRow {
  id: string;
  plan: string;
  billingPeriod: string;
  paymentMethod: string;
  paymentReference: string | null;
  status: string;
  requestedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  orgId: string;
  orgName: string;
  orgSlug: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  pending: "warning",
  approved: "success",
  rejected: "outline",
};

export function BillingRequestsClient({
  requests,
}: {
  requests: BillingRequestRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  const handleApprove = (id: string) => {
    setError(null);
    setActiveId(id);
    startTransition(async () => {
      const result = await approveBillingRequest(id);
      setActiveId(null);
      if (result?.error) setError(result.error);
    });
  };

  const handleReject = (id: string) => {
    setError(null);
    setActiveId(id);
    startTransition(async () => {
      const result = await rejectBillingRequest(id, rejectReason);
      setActiveId(null);
      setRejectingId(null);
      setRejectReason("");
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p role="alert" className="font-body text-sm text-error">
          {error}
        </p>
      )}

      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-12 text-center">
            <p className="font-body text-sm text-secondary-text">
              No payment claims waiting for review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {pending.map((r) => {
              const isRowBusy = isPending && activeId === r.id;
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 border-l-2 border-l-warning p-5 transition-colors hover:bg-background/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/organizations/${r.orgId}`}
                        className="font-heading text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {r.orgName}
                      </Link>
                      <p className="mt-0.5 font-body text-xs text-secondary-text">
                        Requested {formatDate(r.requestedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANT[r.status]}
                      className="text-xs capitalize"
                    >
                      {r.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-1 font-body text-sm text-foreground sm:grid-cols-3">
                    <span>
                      Plan:{" "}
                      <span className="font-medium capitalize">{r.plan}</span>
                    </span>
                    <span>
                      Method:{" "}
                      <span className="font-medium capitalize">
                        {r.paymentMethod.replace("_", " ")}
                      </span>
                    </span>
                    <span>
                      Reference:{" "}
                      <span className="font-mono text-xs">
                        {r.paymentReference || "—"}
                      </span>
                    </span>
                  </div>

                  {rejectingId === r.id ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional) — shown to no one automatically, for your own record"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-body text-xs text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(r.id)}
                        disabled={isRowBusy}
                        className="text-error hover:bg-error/10"
                      >
                        {isRowBusy ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "Confirm reject"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectingId(null)}
                        disabled={isRowBusy}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(r.id)}
                        disabled={isPending}
                      >
                        {isRowBusy ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve & activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingId(r.id)}
                        disabled={isPending}
                        className="text-error hover:bg-error/10"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewed.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
            History
          </h2>
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {reviewed.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 p-4"
              >
                <div>
                  <p className="font-body text-sm text-foreground">
                    {r.orgName} — <span className="capitalize">{r.plan}</span>{" "}
                    via{" "}
                    <span className="capitalize">
                      {r.paymentMethod.replace("_", " ")}
                    </span>
                  </p>
                  <p className="mt-0.5 font-body text-xs text-secondary-text">
                    {r.reviewedAt ? formatDate(r.reviewedAt) : ""}
                    {r.rejectionReason ? ` · ${r.rejectionReason}` : ""}
                  </p>
                </div>
                <Badge
                  variant={STATUS_VARIANT[r.status]}
                  className="text-xs capitalize"
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
