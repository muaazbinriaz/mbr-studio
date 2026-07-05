"use client";

import { useState, useTransition } from "react";
import { Loader2, Clock, CheckCircle2, Send, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import {
  PLANS,
  MANUAL_PAYMENT_METHODS,
  type PlanId,
} from "@/lib/billing/plans";
import { submitBillingRequest } from "./actions";

interface PendingRequest {
  id: string;
  plan: string;
  payment_method: string;
  payment_reference: string | null;
  requested_at: string;
}

interface HistoryRow {
  id: string;
  plan: string;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  active: "success",
  trial: "warning",
  cancelled: "outline",
  suspended: "outline",
};

const HISTORY_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "outline"
> = {
  pending: "warning",
  approved: "success",
  rejected: "outline",
};

export function BillingClient({
  currentPlan,
  currentStatus,
  monthlyMessageLimit,
  messagesThisMonth,
  pendingRequest,
  history,
  managedByReseller,
  resellerName,
}: {
  currentPlan: string;
  currentStatus: string;
  monthlyMessageLimit: number;
  messagesThisMonth: number;
  pendingRequest: PendingRequest | null;
  history: HistoryRow[];
  managedByReseller: boolean;
  resellerName: string | null;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    MANUAL_PAYMENT_METHODS[0].id,
  );
  const [reference, setReference] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedMethod = MANUAL_PAYMENT_METHODS.find(
    (m) => m.id === paymentMethod,
  );

  const usageRatio =
    monthlyMessageLimit > 0 ? messagesThisMonth / monthlyMessageLimit : 0;
  const usagePercent = Math.min(100, Math.round(usageRatio * 100));
  const usageTone =
    usageRatio >= 1
      ? "bg-error"
      : usageRatio >= 0.8
        ? "bg-warning"
        : "bg-primary";

  const handleSubmit = () => {
    if (!selectedPlan) {
      setError("Choose a plan first.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("plan", selectedPlan);
    formData.set("billing_period", "monthly");
    formData.set("payment_method", paymentMethod);
    formData.set("payment_reference", reference);

    startTransition(async () => {
      const result = await submitBillingRequest(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Current status + usage */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs text-secondary-text">
              Current plan
            </p>
            <p className="mt-1 font-heading text-lg font-semibold capitalize text-foreground">
              {currentPlan}
            </p>
          </div>
          <Badge
            variant={STATUS_VARIANT[currentStatus] ?? "outline"}
            className="text-xs capitalize"
          >
            {currentStatus}
          </Badge>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between font-body text-xs text-secondary-text">
            <span>
              {messagesThisMonth.toLocaleString()} /{" "}
              {monthlyMessageLimit.toLocaleString()} messages this month
            </span>
            <span>{usagePercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full transition-all duration-300 ${usageTone}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {usageRatio >= 1 && (
            <p className="mt-2 font-body text-xs text-error">
              You've hit your monthly limit — upgrade to keep your chatbot
              responding.
            </p>
          )}
        </div>
      </div>

      {/* Reseller-managed note — replaces the whole plan-picker/history
          flow for sub-clients, since they never submit their own
          billing requests (see docs/reseller-billing-model.md). */}
      {managedByReseller && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="font-body text-sm text-foreground">
            Your plan is managed by <strong>{resellerName}</strong>. Contact
            them directly if you need to upgrade or have questions about your
            billing.
          </p>
        </div>
      )}

      {/* Pending request banner */}
      {!managedByReseller && (pendingRequest || submitted) && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <Clock className="mt-0.5 h-4 w-4 flex-none text-warning" />
          <div>
            <p className="font-body text-sm font-medium text-foreground">
              Payment under review
            </p>
            <p className="mt-1 font-body text-xs text-secondary-text">
              {submitted
                ? "Your request has been submitted. An admin will confirm your payment and activate your plan shortly."
                : `You requested the "${pendingRequest?.plan}" plan via ${pendingRequest?.payment_method} — waiting for confirmation.`}
            </p>
          </div>
        </div>
      )}

      {/* Plan picker + payment form — hidden for reseller sub-clients
          and while a request is pending */}
      {!managedByReseller && !pendingRequest && !submitted && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(
              ([id, plan]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPlan(id)}
                  className={`flex flex-col rounded-2xl border p-6 text-left transition-colors duration-150 ${
                    selectedPlan === id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <p className="font-heading text-base font-semibold text-foreground">
                    {plan.label}
                  </p>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                    Rs {plan.priceMonthlyPKR.toLocaleString()}
                    <span className="font-body text-sm font-normal text-secondary-text">
                      /mo
                    </span>
                  </p>
                  <ul className="mt-4 flex flex-col gap-1.5 font-body text-xs text-secondary-text">
                    <li>
                      {plan.monthlyMessageLimit.toLocaleString()} messages/mo
                    </li>
                    <li>
                      Up to {plan.maxAgents} agent
                      {plan.maxAgents > 1 ? "s" : ""}
                    </li>
                    <li className="capitalize">{plan.channels.join(", ")}</li>
                  </ul>
                  {selectedPlan === id && (
                    <div className="mt-4 flex items-center gap-1.5 font-body text-xs font-medium text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                    </div>
                  )}
                </button>
              ),
            )}
          </div>

          {selectedPlan && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
                Confirm payment
              </h2>

              <div className="mb-4 flex flex-col gap-1.5">
                <label className="font-body text-sm font-medium text-foreground">
                  Payment method
                </label>
                <div className="flex flex-wrap gap-2">
                  {MANUAL_PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`rounded-lg border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-secondary-text hover:text-foreground"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMethod && (
                <pre className="mb-4 whitespace-pre-wrap rounded-lg bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
                  {selectedMethod.instructions}
                </pre>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-sm font-medium text-foreground">
                  Transaction reference
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. last 4 digits, transaction ID, or timestamp"
                  className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {error && (
                <p className="mt-3 font-body text-sm text-error">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="mt-5"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit for review
              </Button>
            </div>
          )}
        </>
      )}

      {/* Billing history */}
      {!managedByReseller && history.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
            Request history
          </h2>
          <div className="flex flex-col divide-y divide-border">
            {history.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-body text-sm text-foreground">
                    <span className="capitalize">{row.plan}</span> via{" "}
                    <span className="capitalize">
                      {row.payment_method.replace("_", " ")}
                    </span>
                  </p>
                  <p className="mt-0.5 font-body text-xs text-secondary-text">
                    Requested {formatDate(row.requested_at)}
                    {row.reviewed_at &&
                      ` · Reviewed ${formatDate(row.reviewed_at)}`}
                    {row.rejection_reason && ` · ${row.rejection_reason}`}
                  </p>
                </div>
                <Badge
                  variant={HISTORY_STATUS_VARIANT[row.status] ?? "outline"}
                  className="flex items-center gap-1 text-xs capitalize"
                >
                  {row.status === "rejected" && <XCircle className="h-3 w-3" />}
                  {row.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
