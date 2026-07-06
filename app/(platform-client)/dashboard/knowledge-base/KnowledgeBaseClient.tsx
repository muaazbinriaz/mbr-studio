"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
} from "./actions";

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  source_type: string;
  source_url?: string | null;
  created_at: string;
  error_message?: string | null;
  raw_content?: string | null;
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

const CONTENT_PLACEHOLDER = `Example:

Q: What are your opening hours?
A: We're open Monday to Saturday, 10am to 8pm.

Q: Do you offer home delivery?
A: Yes, free delivery within 5km, small fee beyond that.

Write in whatever format makes sense — FAQs, a plain description of your business, policies, pricing. The AI only ever answers from what you put here.`;

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const DEFAULT_SELECT_CAP = 10;

type DiscoveredPage = { url: string; title: string };

export function KnowledgeBaseClient({
  documents,
}: {
  documents: DocumentRow[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- URL discover/select/scrape flow ---
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

  // --- PDF upload flow ---
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<
    "idle" | "uploading" | "processing"
  >("idle");

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

  const handleRefresh = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      await refreshKnowledgeBaseUrlDocument(id);
      setPendingId(null);
    });
  };

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
        // Keep going for the rest — surface the last error rather than
        // aborting the whole batch over one bad page.
        setUrlError(result.error);
      }
    }

    setScrapeProgress(null);
    setDiscoverState("idle");
    setDiscoveredPages([]);
    setSelectedUrls(new Set());
    setRootUrl("");
  };

  const cancelDiscover = () => {
    setDiscoverState("idle");
    setDiscoveredPages([]);
    setSelectedUrls(new Set());
    setUrlError(null);
  };

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
    if (result.error) setPdfError(result.error);

    setPdfStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Add knowledge (manual text) */}
      <form
        ref={formRef}
        onSubmit={handleAdd}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="font-heading text-base font-semibold text-foreground">
          Add knowledge
        </h2>

        <div className="mt-4 flex flex-col gap-1.5">
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

        {error && (
          <p role="alert" className="mt-3 font-body text-sm text-error">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-5">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add to knowledge base
        </Button>
      </form>

      {/* PDF upload */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Upload a PDF
        </h2>
        <p className="mt-1 font-body text-sm text-secondary-text">
          Menus, brochures, price sheets — up to 10MB, text-based (not a scanned
          image).
        </p>

        <div className="mt-4 flex items-center gap-3">
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
            {pdfStatus !== "idle" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
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

      {/* URL scraping */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Scrape from a website
        </h2>
        <p className="mt-1 font-body text-sm text-secondary-text">
          Paste your website&apos;s homepage URL — we&apos;ll find its pages so
          you can pick which ones to add.
        </p>

        {discoverState === "idle" && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
          <div className="mt-4 flex items-center gap-2 font-body text-sm text-secondary-text">
            <Loader2 className="h-4 w-4 animate-spin" />
            Looking for pages on that site...
          </div>
        )}

        {discoverState === "selecting" && (
          <div className="mt-4">
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
          <div className="mt-4 flex items-center gap-2 font-body text-sm text-secondary-text">
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
              const isExpanded = expandedId === doc.id;
              const SourceIcon = SOURCE_ICON[doc.source_type] ?? AlignLeft;
              return (
                <div key={doc.id}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                    className="flex cursor-pointer flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SourceIcon className="h-3.5 w-3.5 flex-none text-secondary-text" />
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
                        <p className="mt-1 font-body text-xs text-error">
                          {doc.error_message}
                        </p>
                      )}
                      {doc.source_type === "url" && doc.source_url && (
                        <p className="mt-1 truncate font-body text-xs text-secondary-text">
                          {doc.source_url}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-none gap-2">
                      {doc.source_type === "url" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefresh(doc.id);
                          }}
                          disabled={isRowPending}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Refresh from source
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReindex(doc.id);
                        }}
                        disabled={isRowPending}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        Re-index
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        disabled={isRowPending}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border bg-background px-4 py-3">
                      <p className="whitespace-pre-wrap font-body text-xs leading-relaxed text-secondary-text">
                        {doc.raw_content || "No content available."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
