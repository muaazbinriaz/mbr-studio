"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  Loader2,
  Plus,
  Trash2,
  RotateCw,
  Upload,
  Link as LinkIcon,
  Globe,
  FileText,
  AlignLeft,
  Search,
  CheckSquare,
  Square,
  X,
  Pencil,
  Save,
  Layers,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  addKnowledgeBaseDocument,
  deleteKnowledgeBaseDocument,
  reindexKnowledgeBaseDocument,
  discoverKnowledgeBaseUrls,
  scrapeAndIngestUrl,
  refreshKnowledgeBaseUrlDocument,
  createPdfUploadUrl,
  ingestUploadedPdf,
  updateKnowledgeBaseDocument,
} from "./actions";

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  source_type: string;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
  raw_content?: string | null;
  chunkCount: number;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  ready: "success",
  processing: "warning",
  error: "outline",
};

const SOURCE_ICON: Record<string, typeof Globe> = {
  url: Globe,
  pdf: FileText,
  manual_text: AlignLeft,
  faq_pair: AlignLeft,
};

const SOURCE_LABEL: Record<string, string> = {
  url: "Website",
  pdf: "PDF",
  manual_text: "Manual",
  faq_pair: "Manual",
};

const CONTENT_PLACEHOLDER = `Example:

Q: What are your opening hours?
A: We're open Monday to Saturday, 10am to 8pm.

Q: Do you offer home delivery?
A: Yes, free delivery within 5km, small fee beyond that.

Write in whatever format makes sense — FAQs, a plain description of your business, policies, pricing. The AI only ever answers from what you put here.`;

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const DEFAULT_SELECT_CAP = 10;

type DiscoveredPage = { url: string; title: string };

// ============================================================
// Root component — two-pane list/detail layout
// ============================================================

export function KnowledgeBaseClient({
  documents,
}: {
  documents: DocumentRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    documents[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.trim().toLowerCase();
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, search]);

  const selected = documents.find((d) => d.id === selectedId) ?? null;

  const handleDelete = (id: string) => {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteKnowledgeBaseDocument(id);
      setPendingId(null);
      setDeleteTarget(null);
      if (result?.error) {
        setError(result.error);
      } else if (selectedId === id) {
        setSelectedId(null);
      }
    });
  };

  const handleReindex = (id: string) => {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await reindexKnowledgeBaseDocument(id);
      setPendingId(null);
      if (result?.error) setError(result.error);
    });
  };

  const handleRefresh = (id: string) => {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await refreshKnowledgeBaseUrlDocument(id);
      setPendingId(null);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-xs">
          <Search className="h-4 w-4 flex-none text-secondary-text" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none"
          />
        </div>
        <Button
          type="button"
          onClick={() => setAddOpen(true)}
          className="sm:w-fit"
        >
          <Plus className="h-4 w-4" />
          Add knowledge
        </Button>
      </div>

      {error && (
        <p role="alert" className="flex-none font-body text-sm text-error">
          {error}
        </p>
      )}

      {/* Two-pane body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* List pane */}
        <div
          className={`${
            selectedId ? "hidden lg:flex" : "flex"
          } min-h-0 flex-col rounded-2xl border border-border bg-card`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-body text-sm text-secondary-text">
                  No documents yet — add your first one.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-body text-sm text-secondary-text">
                  No documents match &quot;{search}&quot;.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {filtered.map((doc) => {
                  const isSelected = selectedId === doc.id;
                  const SourceIcon = SOURCE_ICON[doc.source_type] ?? AlignLeft;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors duration-150 ${
                        isSelected ? "bg-primary/10" : "hover:bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <SourceIcon className="h-3.5 w-3.5 flex-none text-secondary-text" />
                        <p className="min-w-0 flex-1 truncate font-body text-sm font-medium text-foreground">
                          {doc.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {doc.status === "processing" ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-body text-[10px] font-medium capitalize text-warning">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75 motion-reduce:hidden" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-warning" />
                            </span>
                            Processing
                          </span>
                        ) : (
                          <Badge
                            variant={STATUS_VARIANT[doc.status] ?? "outline"}
                            className="text-[10px] capitalize"
                          >
                            {doc.status}
                          </Badge>
                        )}
                        <span className="font-body text-[10px] text-secondary-text">
                          {SOURCE_LABEL[doc.source_type] ?? "Manual"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail pane */}
        <div
          className={`${
            selectedId ? "flex" : "hidden lg:flex"
          } min-h-0 flex-col rounded-2xl border border-border bg-card`}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
              <FileText
                className="h-8 w-8 text-secondary-text"
                strokeWidth={1.5}
              />
              <p className="font-body text-sm text-secondary-text">
                Select a document to view it, or add a new one.
              </p>
            </div>
          ) : (
            <DocumentDetail
              key={selected.id}
              doc={selected}
              isRowPending={isPending && pendingId === selected.id}
              onBack={() => setSelectedId(null)}
              onDelete={() => setDeleteTarget(selected)}
              onReindex={() => handleReindex(selected.id)}
              onRefresh={() => handleRefresh(selected.id)}
            />
          )}
        </div>
      </div>

      {addOpen && <AddKnowledgeModal onClose={() => setAddOpen(false)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this document?"
        description={`"${deleteTarget?.title ?? "This document"}" will be permanently removed from the knowledge base and the bot will no longer reference it. This can't be undone.`}
        confirmLabel="Delete document"
        isLoading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}

// ============================================================
// Detail pane — document viewer + inline edit
// ============================================================

function DocumentDetail({
  doc,
  isRowPending,
  onBack,
  onDelete,
  onReindex,
  onRefresh,
}: {
  doc: DocumentRow;
  isRowPending: boolean;
  onBack: () => void;
  onDelete: () => void;
  onReindex: () => void;
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(doc.raw_content ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const SourceIcon = SOURCE_ICON[doc.source_type] ?? AlignLeft;

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      const result = await updateKnowledgeBaseDocument(doc.id, editContent);
      if (result?.error) {
        setSaveError(result.error);
      } else {
        setIsEditing(false);
      }
    });
  };

  return (
    <>
      <div className="flex flex-none items-start justify-between gap-3 border-b border-border p-5">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex-none rounded-lg p-1 text-secondary-text hover:bg-background lg:hidden"
            aria-label="Back to document list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <SourceIcon className="mt-0.5 h-4 w-4 flex-none text-secondary-text" />
          <div className="min-w-0">
            <h2 className="truncate font-heading text-base font-semibold text-foreground">
              {doc.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant={STATUS_VARIANT[doc.status] ?? "outline"}
                className="text-xs capitalize"
              >
                {doc.status}
              </Badge>
              <span className="flex items-center gap-1 font-body text-xs text-secondary-text">
                <Layers className="h-3 w-3" />
                {doc.chunkCount > 0
                  ? `Split into ${doc.chunkCount} searchable piece${doc.chunkCount === 1 ? "" : "s"}`
                  : "Not yet indexed"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-none gap-2">
          {doc.source_type === "url" && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRowPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
            >
              <Globe className="h-3.5 w-3.5" />
              Refresh from source
            </button>
          )}
          <button
            type="button"
            onClick={onReindex}
            disabled={isRowPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Re-index
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isRowPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {doc.status === "error" && doc.error_message && (
        <p className="flex-none border-b border-border bg-error/5 px-5 py-2.5 font-body text-xs text-error">
          {doc.error_message}
        </p>
      )}

      {doc.source_type === "url" && doc.source_url && (
        <p className="flex-none truncate border-b border-border px-5 py-2.5 font-body text-xs text-secondary-text">
          Source:{" "}
          <a
            href={doc.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {doc.source_url}
          </a>
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isEditing ? (
          <div className="flex h-full flex-col gap-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[240px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {saveError && (
              <p role="alert" className="font-body text-sm text-error">
                {saveError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save & re-ingest
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setEditContent(doc.raw_content ?? "");
                  setIsEditing(false);
                  setSaveError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 font-body text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit content
              </button>
            </div>
            <p className="max-w-2xl whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground">
              {doc.raw_content || "No content available."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Add-knowledge modal — segmented tabs (Manual / Website / PDF)
// ============================================================

function AddKnowledgeModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"manual" | "url" | "pdf">("manual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-card">
        <div className="flex flex-none items-center justify-between border-b border-border p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Add knowledge
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-secondary-text hover:bg-background"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-none gap-1 border-b border-border p-2">
          {(
            [
              { id: "manual", label: "Manual text", icon: AlignLeft },
              { id: "url", label: "Website", icon: Globe },
              { id: "pdf", label: "PDF", icon: FileText },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary/10 text-primary"
                  : "text-secondary-text hover:bg-background"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "manual" && <ManualTab onDone={onClose} />}
          {tab === "url" && <UrlTab onDone={onClose} />}
          {tab === "pdf" && <PdfTab onDone={onClose} />}
        </div>
      </div>
    </div>
  );
}

function ManualTab({ onDone }: { onDone: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addKnowledgeBaseDocument(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        onDone();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleAdd} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="title"
          className="font-body text-sm font-medium text-foreground"
        >
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

      <div className="flex flex-col gap-1.5">
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

      {error && (
        <p role="alert" className="font-body text-sm text-error">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add to knowledge base
      </Button>
    </form>
  );
}

function UrlTab({ onDone }: { onDone: () => void }) {
  const [rootUrl, setRootUrl] = useState("");
  type DiscoverState = "idle" | "discovering" | "selecting" | "scraping";
  const [discoverState, setDiscoverState] = useState<DiscoverState>("idle");
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [urlError, setUrlError] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<{
    index: number;
    total: number;
  } | null>(null);

  const handleDiscover = async () => {
    setUrlError(null);
    if (!rootUrl.trim()) {
      setUrlError("Enter a URL first.");
      return;
    }
    setDiscoverState("discovering");
    const result = await discoverKnowledgeBaseUrls(rootUrl.trim());
    if (result.error) {
      setUrlError(result.error);
      setDiscoverState("idle");
      return;
    }
    if (result.pages.length === 0) {
      setUrlError("No pages found on that site.");
      setDiscoverState("idle");
      return;
    }
    setDiscoveredPages(result.pages);
    setSelectedUrls(
      new Set(result.pages.slice(0, DEFAULT_SELECT_CAP).map((p) => p.url)),
    );
    setDiscoverState("selecting");
  };

  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedUrls(new Set(discoveredPages.map((p) => p.url)));
  const selectNone = () => setSelectedUrls(new Set());

  const handleScrapeSelected = async () => {
    const urls = Array.from(selectedUrls);
    if (urls.length === 0) {
      setUrlError("Select at least one page.");
      return;
    }

    setUrlError(null);
    setDiscoverState("scraping");

    for (let i = 0; i < urls.length; i++) {
      setScrapeProgress({ index: i + 1, total: urls.length });
      const result = await scrapeAndIngestUrl(urls[i]);
      if (result.error) {
        setUrlError(result.error);
      }
    }

    setScrapeProgress(null);
    setDiscoverState("idle");
    setDiscoveredPages([]);
    setSelectedUrls(new Set());
    setRootUrl("");
    onDone();
  };

  const cancelDiscover = () => {
    setDiscoverState("idle");
    setDiscoveredPages([]);
    setSelectedUrls(new Set());
    setUrlError(null);
  };

  return (
    <div>
      <p className="mb-4 font-body text-sm text-secondary-text">
        Paste your website&apos;s homepage URL — we&apos;ll find its pages so
        you can pick which ones to add.
      </p>

      {discoverState === "idle" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <LinkIcon className="h-4 w-4 flex-none text-secondary-text" />
            <input
              value={rootUrl}
              onChange={(e) => setRootUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none"
            />
          </div>
          <Button type="button" onClick={handleDiscover}>
            <Search className="h-4 w-4" />
            Find pages
          </Button>
        </div>
      )}

      {discoverState === "discovering" && (
        <div className="flex items-center gap-2 font-body text-sm text-secondary-text">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking for pages on that site...
        </div>
      )}

      {discoverState === "selecting" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-body text-sm text-secondary-text">
              Found {discoveredPages.length} page
              {discoveredPages.length === 1 ? "" : "s"} — pick which to add.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={selectAll}
                className="font-body text-xs font-medium text-primary hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="font-body text-xs font-medium text-secondary-text hover:underline"
              >
                Select none
              </button>
            </div>
          </div>

          <div className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {discoveredPages.map((page) => {
              const checked = selectedUrls.has(page.url);
              return (
                <label
                  key={page.url}
                  className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 hover:bg-background"
                >
                  <button
                    type="button"
                    onClick={() => toggleUrl(page.url)}
                    className="mt-0.5 flex-none text-secondary-text"
                  >
                    {checked ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <span className="min-w-0">
                    <span className="block truncate font-body text-sm text-foreground">
                      {page.title}
                    </span>
                    <span className="block truncate font-body text-xs text-secondary-text">
                      {page.url}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex gap-3">
            <Button type="button" onClick={handleScrapeSelected}>
              Add selected pages ({selectedUrls.size})
            </Button>
            <Button type="button" variant="outline" onClick={cancelDiscover}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {discoverState === "scraping" && scrapeProgress && (
        <div className="flex items-center gap-2 font-body text-sm text-secondary-text">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scraping page {scrapeProgress.index} of {scrapeProgress.total}...
        </div>
      )}

      {urlError && (
        <p role="alert" className="mt-3 font-body text-sm text-error">
          {urlError}
        </p>
      )}
    </div>
  );
}

function PdfTab({ onDone }: { onDone: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<
    "idle" | "uploading" | "processing"
  >("idle");

  const handlePdfSelect = async (file: File | undefined) => {
    setPdfError(null);
    if (!file) return;

    if (file.type !== "application/pdf") {
      setPdfError("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setPdfError("File is too large — max 10MB.");
      return;
    }

    setPdfStatus("uploading");
    const { error: signError, data } = await createPdfUploadUrl(file.name);
    if (signError || !data) {
      setPdfError(signError ?? "Could not start the upload.");
      setPdfStatus("idle");
      return;
    }

    try {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("knowledge-base-pdfs")
        .uploadToSignedUrl(data.path, data.token, file);

      if (uploadError) {
        setPdfError(uploadError.message);
        setPdfStatus("idle");
        return;
      }
    } catch {
      setPdfError("Upload failed — check your connection and try again.");
      setPdfStatus("idle");
      return;
    }

    setPdfStatus("processing");
    const result = await ingestUploadedPdf(data.path, file.name);
    if (result.error) {
      setPdfError(result.error);
    } else {
      onDone();
    }

    setPdfStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-4 font-body text-sm text-secondary-text">
        Menus, brochures, price sheets — up to 10MB, text-based (not a scanned
        image).
      </p>

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          disabled={pdfStatus !== "idle"}
          onChange={(e) => handlePdfSelect(e.target.files?.[0])}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-body text-sm text-foreground transition-colors hover:bg-background/70 ${
            pdfStatus !== "idle" ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {pdfStatus === "idle" && <Upload className="h-4 w-4" />}
          {pdfStatus !== "idle" && <Loader2 className="h-4 w-4 animate-spin" />}
          {pdfStatus === "idle" && "Choose PDF"}
          {pdfStatus === "uploading" && "Uploading..."}
          {pdfStatus === "processing" && "Processing..."}
        </label>
      </div>

      {pdfError && (
        <p role="alert" className="mt-3 font-body text-sm text-error">
          {pdfError}
        </p>
      )}
    </div>
  );
}
