"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WEBHOOK_EVENT_TYPES } from "@/lib/webhooks/events";
import {
  createWebhookEndpoint,
  toggleWebhookEndpoint,
  deleteWebhookEndpoint,
} from "./actions";
import { formatDate } from "@/lib/formatters";

interface Endpoint {
  id: string;
  target_url: string;
  subscribed_events: string[];
  is_active: boolean;
  created_at: string;
}

interface FailedDelivery {
  id: string;
  event_type: string;
  delivery_attempts: number;
  last_error: string | null;
  created_at: string;
}

export function WebhooksClient({
  endpoints,
  failedDeliveries,
}: {
  endpoints: Endpoint[];
  failedDeliveries: FailedDelivery[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);

  const handleCreate = (formData: FormData) => {
    setError(null);
    setNewSecret(null);
    startTransition(async () => {
      const result = await createWebhookEndpoint(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.secret) {
        setNewSecret(result.secret);
        formRef.current?.reset();
      }
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleWebhookEndpoint(id, !current);
    });
  };

  const handleDelete = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteWebhookEndpoint(id);
      if (result.error) setError(result.error);
      setDeleteTarget(null);
    });
  };

  const copySecret = () => {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {newSecret && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <div className="mb-2 flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-body text-sm font-semibold">
              Copy this signing secret now — you won&apos;t see it again.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2.5">
            <code className="truncate font-mono text-xs text-foreground">
              {newSecret}
            </code>
            <button
              type="button"
              onClick={copySecret}
              className="flex-none rounded-md p-1.5 text-secondary-text hover:bg-card hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {copied && (
            <p className="mt-2 font-body text-xs text-success">Copied.</p>
          )}
        </div>
      )}

      <form
        ref={formRef}
        action={handleCreate}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">
            Target URL
          </label>
          <input
            name="target_url"
            placeholder="https://hooks.zapier.com/..."
            required
            className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 font-body text-sm font-medium text-foreground">
            Events
          </p>
          <div className="grid grid-cols-2 gap-2">
            {WEBHOOK_EVENT_TYPES.map((evt) => (
              <label
                key={evt}
                className="flex items-center gap-2 font-body text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  name={`event_${evt}`}
                  className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
                />
                {evt}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 font-body text-sm text-error">{error}</p>}

        <Button type="submit" disabled={isPending} className="mt-4">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add webhook endpoint
        </Button>
      </form>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {endpoints.length === 0 ? (
          <p className="p-5 font-body text-sm text-secondary-text">
            No webhook endpoints yet.
          </p>
        ) : (
          endpoints.map((ep) => (
            <div key={ep.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-body text-sm font-medium text-foreground">
                    {ep.target_url}
                  </p>
                  <Badge
                    variant={ep.is_active ? "success" : "outline"}
                    className="text-xs"
                  >
                    {ep.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 font-body text-xs text-secondary-text">
                  {ep.subscribed_events.join(", ")} · Created{" "}
                  {formatDate(ep.created_at)}
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(ep.id, ep.is_active)}
                  disabled={isPending}
                  className="rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground hover:bg-background"
                >
                  {ep.is_active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(ep)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error hover:bg-error/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {failedDeliveries.length > 0 && (
        <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
          <p className="mb-3 flex items-center gap-2 font-body text-sm font-semibold text-error">
            <AlertTriangle className="h-4 w-4" />
            Failed deliveries (still retrying)
          </p>
          <div className="flex flex-col gap-2">
            {failedDeliveries.map((fd) => (
              <div
                key={fd.id}
                className="rounded-lg bg-background px-3 py-2 font-body text-xs text-secondary-text"
              >
                {fd.event_type} — {fd.delivery_attempts} attempt(s) —{" "}
                {fd.last_error ?? "unknown error"} — {formatDate(fd.created_at)}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this webhook endpoint?"
        description={`Events will stop being sent to ${deleteTarget?.target_url ?? "this URL"}. This can't be undone.`}
        confirmLabel="Delete endpoint"
        isLoading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}
