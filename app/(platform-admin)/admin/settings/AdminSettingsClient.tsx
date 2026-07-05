"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { addAdminByEmail, removeAdmin } from "./actions";

interface AdminRow {
  userId: string;
  email: string;
  createdAt: string;
  isYou: boolean;
}

export function AdminSettingsClient({
  admins,
  currentUserEmail,
}: {
  admins: AdminRow[];
  currentUserEmail?: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAdd = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await addAdminByEmail(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  const handleRemove = (userId: string) => {
    setError(null);
    setPendingId(userId);
    startTransition(async () => {
      const result = await removeAdmin(userId);
      setPendingId(null);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Admins ({admins.length})
          </h2>
        </div>

        <form
          ref={formRef}
          action={handleAdd}
          className="mb-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="teammate@company.com"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button type="submit" disabled={isPending} className="sm:w-auto">
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add admin
          </Button>
        </form>

        {error && (
          <p role="alert" className="mb-4 font-body text-sm text-error">
            {error}
          </p>
        )}

        <div className="flex flex-col divide-y divide-border">
          {admins.map((admin) => {
            const isRowBusy = isPending && pendingId === admin.userId;
            return (
              <div
                key={admin.userId}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-medium text-foreground">
                      {admin.email}
                    </p>
                    {admin.isYou && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-body text-xs text-secondary-text">
                    Added {formatDate(admin.createdAt)}
                  </p>
                </div>
                {!admin.isYou && (
                  <button
                    type="button"
                    onClick={() => handleRemove(admin.userId)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                  >
                    {isRowBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="font-body text-xs text-secondary-text">
        Logged in as {currentUserEmail}. Admin access is platform-wide — admins
        can see and manage every organization, not just their own.
      </p>
    </div>
  );
}
