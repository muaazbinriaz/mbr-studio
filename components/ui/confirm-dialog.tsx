"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" (red, default) or "default" for non-destructive confirmations */
  variant?: "destructive" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared confirmation modal for any irreversible/destructive action
 * (revoke key, delete document, remove admin, disconnect channel, etc.).
 *
 * Usage pattern:
 *   const [confirmId, setConfirmId] = useState<string | null>(null);
 *   <button onClick={() => setConfirmId(row.id)}>Delete</button>
 *   <ConfirmDialog
 *     open={!!confirmId}
 *     title="Delete this document?"
 *     description="This can't be undone."
 *     isLoading={isPending}
 *     onCancel={() => setConfirmId(null)}
 *     onConfirm={() => { handleDelete(confirmId!); setConfirmId(null); }}
 *   />
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isLoading, onCancel]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoading && onCancel()}
            aria-hidden="true"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <div className="mb-4 flex items-start gap-3">
              {variant === "destructive" && (
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-error/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-error" />
                </div>
              )}
              <div>
                <h2
                  id="confirm-dialog-title"
                  className="font-heading text-sm font-semibold text-foreground"
                >
                  {title}
                </h2>
                <p
                  id="confirm-dialog-description"
                  className="mt-1 font-body text-sm text-secondary-text"
                >
                  {description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                autoFocus
                disabled={isLoading}
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={variant === "destructive" ? "destructive" : "default"}
                size="sm"
                loading={isLoading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
