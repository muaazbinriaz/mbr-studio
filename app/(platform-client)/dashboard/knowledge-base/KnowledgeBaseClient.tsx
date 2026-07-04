"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, Trash2, RotateCw, Upload, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  addKnowledgeBaseDocument,
  deleteKnowledgeBaseDocument,
  reindexKnowledgeBaseDocument,
} from "./actions";

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  source_type: string;
  created_at: string;
  error_message?: string | null;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  ready: "success",
  processing: "warning",
  error: "outline",
};

const CONTENT_PLACEHOLDER = `Example:

Q: What are your opening hours?
A: We're open Monday to Saturday, 10am to 8pm.

Q: Do you offer home delivery?
A: Yes, free delivery within 5km, small fee beyond that.

Write in whatever format makes sense — FAQs, a plain description of your business, policies, pricing. The AI only ever answers from what you put here.`;

export function KnowledgeBaseClient({ documents }: { documents: DocumentRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addKnowledgeBaseDocument(formData);
      if (result?.error) setError(result.error);
      else formRef.current?.reset();
    });
  };

  const handleDelete = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      await deleteKnowledgeBaseDocument(id);
      setPendingId(null);
    });
  };

  const handleReindex = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      await reindexKnowledgeBaseDocument(id);
      setPendingId(null);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Add knowledge */}
      <form
        ref={formRef}
        onSubmit={handleAdd}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="font-heading text-base font-semibold text-foreground">
          Add knowledge
        </h2>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="title" className="font-body text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. Pricing & Hours"
            className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label
            htmlFor="rawContent"
            className="font-body text-sm font-medium text-foreground"
          >
            Content
          </label>
          <textarea
            id="rawContent"
            name="rawContent"
            required
            rows={8}
            placeholder={CONTENT_PLACEHOLDER}
            className="resize-none rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled
            title="Coming in a future update"
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/50 px-4 py-2.5 font-body text-sm text-secondary-text opacity-60 cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            Upload PDF <span className="text-xs">(coming soon)</span>
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background/50 px-4 py-2.5 opacity-60">
            <LinkIcon className="h-4 w-4 flex-none text-secondary-text" />
            <input
              disabled
              placeholder="Scrape from URL (coming soon)"
              className="w-full bg-transparent font-body text-sm text-secondary-text placeholder:text-secondary-text cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 font-body text-sm text-error">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-5">
          {isPending ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
          Add to knowledge base
        </Button>
      </form>

      {/* Document list */}
      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
          Documents
        </h2>
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-14 text-center">
            <p className="font-body text-sm text-secondary-text">
              No knowledge base documents yet — add your first one above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {documents.map((doc) => {
              const isRowPending = isPending && pendingId === doc.id;
              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-body text-sm font-medium text-foreground">
                        {doc.title}
                      </p>
                      <Badge
                        variant={STATUS_VARIANT[doc.status] ?? "outline"}
                        className="text-xs capitalize"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    {doc.status === "error" && doc.error_message && (
                      <p className="mt-1 font-body text-xs text-error">{doc.error_message}</p>
                    )}
                  </div>
                  <div className="flex flex-none gap-2">
                    <button
                      type="button"
                      onClick={() => handleReindex(doc.id)}
                      disabled={isRowPending}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Re-index
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={isRowPending}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
