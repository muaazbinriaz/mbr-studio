"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createApiKey, revokeApiKey } from "./actions";
import { formatDate } from "@/lib/formatters";

interface ApiKeyRow {
  id: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  masked: string;
}

export function ApiKeysClient({ keys }: { keys: ApiKeyRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);

  const handleCreate = (formData: FormData) => {
    setError(null);
    setNewKey(null);
    startTransition(async () => {
      const result = await createApiKey(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.rawKey) {
        setNewKey(result.rawKey);
        formRef.current?.reset();
      }
    });
  };

  const handleRevoke = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await revokeApiKey(id);
      if (result.error) setError(result.error);
      setRevokeTarget(null);
    });
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {newKey && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <div className="mb-2 flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-body text-sm font-semibold">
              Copy this key now — you won&apos;t see it again.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2.5">
            <code className="truncate font-mono text-xs text-foreground">
              {newKey}
            </code>
            <button
              type="button"
              onClick={copyKey}
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
        className="flex gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <input
          name="label"
          placeholder="Key label (e.g. Zapier integration)"
          required
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Generate key
        </Button>
      </form>
      {error && <p className="font-body text-sm text-error">{error}</p>}

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {keys.length === 0 ? (
          <p className="p-5 font-body text-sm text-secondary-text">
            No API keys yet.
          </p>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-body text-sm font-medium text-foreground">
                    {key.label}
                  </p>
                  {key.revoked_at && (
                    <Badge variant="outline" className="text-xs">
                      Revoked
                    </Badge>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-secondary-text">
                  {key.masked}
                </p>
                <p className="mt-1 font-body text-xs text-secondary-text">
                  Created {formatDate(key.created_at)}
                  {key.last_used_at &&
                    ` · Last used ${formatDate(key.last_used_at)}`}
                </p>
              </div>
              {!key.revoked_at && (
                <button
                  type="button"
                  onClick={() => setRevokeTarget(key)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error hover:bg-error/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke this API key?"
        description={`Any integration using "${revokeTarget?.label ?? "this key"}" will immediately stop working. This can't be undone.`}
        confirmLabel="Revoke key"
        isLoading={isPending}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => revokeTarget && handleRevoke(revokeTarget.id)}
      />
    </div>
  );
}
