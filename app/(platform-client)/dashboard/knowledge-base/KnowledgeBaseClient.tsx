"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  useEffect,
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
  HelpCircle,
  Search,
  CheckSquare,
  Square,
  Pencil,
  Save,
  Layers,
  ArrowLeft,
  Sparkles,
  Star,
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
  testKnowledgeBaseQuery,
} from "./actions";

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  source_type: string;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
  last_refreshed_at?: string | null;
  error_message?: string | null;
  raw_content?: string | null;
  chunkCount: number;
};

const STALE_DAYS = 30;

function isStaleWebsiteDoc(
  doc: Pick<DocumentRow, "source_type" | "last_refreshed_at">,
): boolean {
  if (doc.source_type !== "url" || !doc.last_refreshed_at) return false;
  const diffDays =
    (Date.now() - new Date(doc.last_refreshed_at).getTime()) / 86_400_000;
  return diffDays >= STALE_DAYS;
}

/**
 * A document can be marked "ready" in the DB (content saved fine) while
 * still having zero indexed chunks — e.g. seed/demo rows inserted
 * outside the normal ingest pipeline, or a re-index that's still in
 * flight. Showing a green "Synced" badge next to "Not yet indexed" in
 * that case tells the client two contradictory things at once, since
 * the agent can't actually answer from a document with 0 chunks.
 * This derives one honest label + variant so the list row and the
 * detail header can never disagree with each other.
 */
function getDisplayStatus(
  doc: Pick<
    DocumentRow,
    "status" | "chunkCount" | "source_type" | "last_refreshed_at"
  >,
): {
  label: string;
  variant: "success" | "warning" | "outline" | "destructive";
} {
  if (doc.status === "ready" && doc.chunkCount === 0) {
    return { label: "Needs re-index", variant: "warning" };
  }
  if (doc.status === "error") {
    return { label: "Failed", variant: "destructive" };
  }
  if (doc.status === "processing") {
    return { label: "Processing", variant: "warning" };
  }
  if (isStaleWebsiteDoc(doc)) {
    return { label: "Stale", variant: "warning" };
  }
  return { label: "Synced", variant: "success" };
}

type SourceTabId = "url" | "pdf" | "manual_text" | "faq_pair";

const SOURCE_TABS: { id: SourceTabId; label: string; icon: typeof Globe }[] = [
  { id: "url", label: "Website", icon: Globe },
  { id: "pdf", label: "Files", icon: FileText },
  { id: "manual_text", label: "Text", icon: AlignLeft },
  { id: "faq_pair", label: "Q&A", icon: HelpCircle },
];

const SOURCE_ICON: Record<string, typeof Globe> = {
  url: Globe,
  pdf: FileText,
  manual_text: AlignLeft,
  faq_pair: HelpCircle,
};

const SEED_PLACEHOLDER_SUFFIX = "(example — replace with real info)";

function isSeedPlaceholder(title: string): boolean {
  return title.includes(SEED_PLACEHOLDER_SUFFIX);
}

function stripSeedSuffix(title: string): string {
  return title.replace(` — ${SEED_PLACEHOLDER_SUFFIX}`, "").trim();
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Client-only relative time to avoid hydration mismatches — unchanged,
// do not reintroduce the hydration bug here.
function RelativeTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(formatRelativeTime(iso));
  }, [iso]);
  return (
    <span suppressHydrationWarning>
      {text ?? new Date(iso).toLocaleDateString()}
    </span>
  );
}

function getPreview(text?: string | null, max = 72): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

type ContentChunk =
  | { type: "qa"; question: string; answer: string }
  | { type: "text"; text: string };

function parseContentChunks(raw: string): ContentChunk[] {
  return raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^Q:\s*([\s\S]*?)\nA:\s*([\s\S]*)$/i);
      return match
        ? {
            type: "qa" as const,
            question: match[1].trim(),
            answer: match[2].trim(),
          }
        : { type: "text" as const, text: block };
    });
}

const CONTENT_PLACEHOLDER = `Write in whatever format makes sense — a plain description of your business, policies, pricing, opening hours. The AI only ever answers from what you put here.`;

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const DEFAULT_SELECT_CAP = 10;

type DiscoveredPage = { url: string; title: string };

const IMPORTANT_PATH_HINTS = [
  "pricing",
  "price",
  "plans",
  "about",
  "faq",
  "help",
  "support",
  "contact",
  "hours",
  "location",
  "service",
];

function isLikelyImportantPage(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return IMPORTANT_PATH_HINTS.some((hint) => path.includes(hint));
  } catch {
    return false;
  }
}

// ============================================================
// Root component — source-type tabs, each with its own add
// mechanism and its own list, plus a shared detail pane.
// ============================================================

export function KnowledgeBaseClient({
  documents,
}: {
  documents: DocumentRow[];
}) {
  const [activeTab, setActiveTab] = useState<SourceTabId>("url");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);

  const tabCounts = useMemo(() => {
    const counts: Record<SourceTabId, number> = {
      url: 0,
      pdf: 0,
      manual_text: 0,
      faq_pair: 0,
    };
    for (const d of documents) {
      if (d.source_type in counts) {
        counts[d.source_type as SourceTabId] += 1;
      }
    }
    return counts;
  }, [documents]);

  const tabDocuments = useMemo(
    () => documents.filter((d) => d.source_type === activeTab),
    [documents, activeTab],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return tabDocuments;
    const q = search.trim().toLowerCase();
    return tabDocuments.filter((d) => d.title.toLowerCase().includes(q));
  }, [tabDocuments, search]);

  const selected = documents.find((d) => d.id === selectedId) ?? null;

  const switchTab = (tab: SourceTabId) => {
    setActiveTab(tab);
    setSelectedId(null);
    setSearch("");
  };

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
      <KnowledgeTestPanel />

      {error && (
        <p role="alert" className="flex-none font-body text-sm text-error">
          {error}
        </p>
      )}

      {/* Source-type tabs — horizontally scrollable on narrow screens
          instead of squeezing 4 tabs into a fixed-width row. */}
      <div className="flex flex-none gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5">
        {SOURCE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`flex flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-body text-sm font-medium transition-colors sm:flex-1 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-secondary-text hover:bg-background"
              }`}
            >
              <Icon className="h-4 w-4 flex-none" />
              {tab.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 font-body text-[10px] ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-background text-secondary-text"
                }`}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two-pane body: add-panel + list on the left, detail on the right.
          Wrapped in @container so this responds to the space it ACTUALLY
          has (e.g. squeezed into the onboarding wizard's 55%-width column)
          instead of the viewport's lg: breakpoint. Without this, a fixed
          400px sidebar + "wide" 1fr detail pane gets squeezed into an
          unusably narrow sliver whenever this component is embedded in a
          narrower host layout — which is exactly what was happening. */}
      <div className="min-h-0 flex-1 @container">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 @3xl:grid-cols-[360px_1fr]">
          <div
            className={`${
              selectedId ? "hidden @3xl:flex" : "flex"
            } min-h-0 flex-col gap-4 overflow-y-auto @3xl:overflow-visible`}
          >
            <div className="flex-none rounded-2xl border border-border bg-card p-4">
              {activeTab === "url" && <WebsiteAddPanel />}
              {activeTab === "pdf" && <FilesAddPanel />}
              {activeTab === "manual_text" && <TextAddPanel />}
              {activeTab === "faq_pair" && <QaAddPanel />}
            </div>

            <div className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex-none border-b border-border p-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <Search className="h-4 w-4 flex-none text-secondary-text" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${SOURCE_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
                    className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none"
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {tabDocuments.length === 0 ? (
                  <TabEmptyState tab={activeTab} />
                ) : filtered.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="font-body text-sm text-secondary-text">
                      No matches for &quot;{search}&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border">
                    {filtered.map((doc) => (
                      <DocumentRowItem
                        key={doc.id}
                        doc={doc}
                        isSelected={selectedId === doc.id}
                        onSelect={() => setSelectedId(doc.id)}
                        onQuickRefresh={
                          doc.source_type === "url"
                            ? () => handleRefresh(doc.id)
                            : undefined
                        }
                        isRefreshing={isPending && pendingId === doc.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail pane */}
          <div
            className={`${
              selectedId ? "flex" : "hidden @3xl:flex"
            } min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card`}
          >
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <FileText
                  className="h-8 w-8 text-secondary-text"
                  strokeWidth={1.5}
                />
                <p className="font-body text-sm text-secondary-text">
                  Select an entry to view it, or add a new one on the left.
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
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this entry?"
        description={`"${deleteTarget?.title ?? "This entry"}" will be permanently removed from the knowledge base and the bot will no longer reference it. This can't be undone.`}
        confirmLabel="Delete"
        isLoading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}

function TabEmptyState({ tab }: { tab: SourceTabId }) {
  const copy: Record<SourceTabId, string> = {
    url: "No pages added yet — scan your website above and pick which pages to include.",
    pdf: "No files yet — upload a PDF above and it'll show up here once it's ready.",
    manual_text: "No text entries yet — write your first one above.",
    faq_pair: "No Q&A pairs yet — add your first question and answer above.",
  };
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-body text-sm text-secondary-text">{copy[tab]}</p>
    </div>
  );
}

// ============================================================
// "Test what your agent knows" — collapsible retrieval search
// ============================================================

function KnowledgeTestPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    | {
        documentId: string;
        title: string;
        sourceType: string;
        snippet: string;
        similarity: number;
      }[]
    | null
  >(null);

  const handleTest = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setResults(null);
    startTransition(async () => {
      const result = await testKnowledgeBaseQuery(query.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setResults(result.matches);
      }
    });
  };

  return (
    <div className="flex-none rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5"
      >
        <span className="flex items-center gap-2 font-body text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Test what your agent knows
        </span>
        <span className="font-body text-xs text-secondary-text">
          {open ? "Hide" : "Try it"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <p className="mb-3 font-body text-sm text-secondary-text">
            Type a question a visitor might ask — we&apos;ll show which entries
            your agent would actually use to answer it.
          </p>
          <form
            onSubmit={handleTest}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Do you deliver on weekends?"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button type="submit" disabled={isPending || !query.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Test
            </Button>
          </form>

          {error && (
            <p role="alert" className="mt-3 font-body text-sm text-error">
              {error}
            </p>
          )}

          {results && results.length === 0 && !error && (
            <p className="mt-4 font-body text-sm text-secondary-text">
              Nothing in your knowledge base confidently matches this — consider
              adding it, or try rephrasing the question.
            </p>
          )}

          {results && results.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {results.map((r, i) => (
                <div
                  key={`${r.documentId}-${i}`}
                  className="rounded-lg border border-border bg-background px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {(() => {
                        const Icon = SOURCE_ICON[r.sourceType] ?? AlignLeft;
                        return (
                          <Icon className="h-3.5 w-3.5 flex-none text-secondary-text" />
                        );
                      })()}
                      <p className="truncate font-body text-xs font-semibold text-foreground">
                        {r.title}
                      </p>
                    </div>
                    <span className="flex-none rounded-full bg-primary/10 px-2 py-0.5 font-body text-[10px] font-medium text-primary">
                      {Math.round(r.similarity * 100)}% match
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs leading-relaxed text-secondary-text">
                    {r.snippet}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// List row
// ============================================================

function DocumentRowItem({
  doc,
  isSelected,
  onSelect,
  onQuickRefresh,
  isRefreshing,
}: {
  doc: DocumentRow;
  isSelected: boolean;
  onSelect: () => void;
  onQuickRefresh?: () => void;
  isRefreshing: boolean;
}) {
  const isSeed = isSeedPlaceholder(doc.title);
  const displayTitle = isSeed ? stripSeedSuffix(doc.title) : doc.title;
  const preview = getPreview(doc.raw_content);
  const status = getDisplayStatus(doc);
  const important =
    doc.source_type === "url" && doc.source_url
      ? isLikelyImportantPage(doc.source_url)
      : false;
  const timestampIso =
    doc.source_type === "url" && doc.last_refreshed_at
      ? doc.last_refreshed_at
      : doc.updated_at;

  return (
    <div
      className={`flex w-full items-start gap-1.5 px-4 py-3 transition-colors duration-150 ${
        isSelected ? "bg-primary/10" : "hover:bg-background"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-body text-sm font-medium text-foreground">
            {displayTitle}
          </p>
          {important && (
            <span className="flex flex-none items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-body text-[9px] font-medium uppercase tracking-wide text-primary">
              <Star className="h-2.5 w-2.5" />
              Key page
            </span>
          )}
          {isSeed && (
            <span className="flex-none rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 font-body text-[9px] font-medium uppercase tracking-wide text-warning">
              Sample
            </span>
          )}
        </div>
        {preview && (
          <p className="mt-1 truncate font-body text-xs text-secondary-text">
            {preview}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          {doc.status === "processing" ? (
            <span className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-body text-[10px] font-medium text-warning">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-warning" />
              </span>
              Processing
            </span>
          ) : (
            <Badge variant={status.variant} className="text-[10px]">
              {status.label}
            </Badge>
          )}
          <span className="font-body text-[10px] text-secondary-text">·</span>
          <span className="font-body text-[10px] text-secondary-text">
            {doc.source_type === "url" ? "Last synced " : ""}
            <RelativeTime iso={timestampIso} />
          </span>
        </div>
      </button>
      {onQuickRefresh && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickRefresh();
          }}
          disabled={isRefreshing}
          aria-label="Re-sync this page now"
          title="Re-sync this page now"
          className="mt-0.5 flex-none rounded-lg p-1.5 text-secondary-text transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCw className="h-3.5 w-3.5" />
          )}
        </button>
      )}
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
  const status = getDisplayStatus(doc);
  const stale = isStaleWebsiteDoc(doc);

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
      <div className="flex flex-none flex-col items-start gap-3 border-b border-border p-5 sm:flex-row sm:justify-between">
        <div className="flex w-full min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex-none rounded-lg p-1 text-secondary-text hover:bg-background @3xl:hidden"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <SourceIcon className="mt-0.5 h-4 w-4 flex-none text-secondary-text" />
          <div className="min-w-0">
            <h2 className="truncate font-heading text-base font-semibold text-foreground">
              {doc.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
              <span
                className={`flex items-center gap-1 font-body text-xs ${
                  doc.status === "ready" && doc.chunkCount === 0
                    ? "text-warning"
                    : "text-secondary-text"
                }`}
              >
                <Layers className="h-3 w-3" />
                {doc.status === "processing"
                  ? "Indexing in progress…"
                  : doc.status === "ready" && doc.chunkCount === 0
                    ? "No content indexed — click Re-index below"
                    : doc.chunkCount > 0
                      ? `Split into ${doc.chunkCount} searchable piece${doc.chunkCount === 1 ? "" : "s"}`
                      : "Not yet indexed"}
              </span>
            </div>
            {doc.source_type === "url" && doc.last_refreshed_at && (
              <p
                className={`mt-1 font-body text-xs ${stale ? "text-warning" : "text-secondary-text"}`}
              >
                Last synced <RelativeTime iso={doc.last_refreshed_at} />
                {stale &&
                  " — this page hasn't been re-scanned in over 30 days, re-sync to make sure your agent has the latest info."}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-none flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          {doc.source_type === "url" && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRowPending}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
            >
              <RotateCw className="h-3.5 w-3.5 flex-none" />
              Re-sync now
            </button>
          )}
          <button
            type="button"
            onClick={onReindex}
            disabled={isRowPending}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
          >
            <Layers className="h-3.5 w-3.5 flex-none" />
            Re-index
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isRowPending}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 font-body text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5 flex-none" />
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
                Save
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
            {doc.raw_content ? (
              <div className="flex max-w-2xl flex-col gap-3 overflow-y-auto">
                {parseContentChunks(doc.raw_content).map((chunk, i) =>
                  chunk.type === "qa" ? (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-background px-3.5 py-3"
                    >
                      <p className="font-body text-xs font-semibold text-primary">
                        {chunk.question}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground">
                        {chunk.answer}
                      </p>
                    </div>
                  ) : (
                    <p
                      key={i}
                      className="whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground"
                    >
                      {chunk.text}
                    </p>
                  ),
                )}
              </div>
            ) : (
              <p className="max-w-2xl font-body text-sm leading-relaxed text-secondary-text">
                No content available.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Website tab — scan + pick pages
// ============================================================

function WebsiteAddPanel() {
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

  const hostname = (() => {
    try {
      return new URL(rootUrl).hostname;
    } catch {
      return rootUrl;
    }
  })();

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
  };

  const cancelDiscover = () => {
    setDiscoverState("idle");
    setDiscoveredPages([]);
    setSelectedUrls(new Set());
    setUrlError(null);
  };

  return (
    <div>
      <p className="mb-3 font-body text-sm font-medium text-foreground">
        Add from your website
      </p>
      <p className="mb-4 font-body text-sm text-secondary-text">
        Paste your homepage URL — we&apos;ll scan your live site and find its
        pages so you can pick which ones to add.
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
            Scan site
          </Button>
        </div>
      )}

      {discoverState === "discovering" && (
        <div className="flex items-center gap-2 font-body text-sm text-secondary-text">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning {hostname}...
        </div>
      )}

      {discoverState === "selecting" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-body text-sm text-secondary-text">
              We scanned {hostname} and found {discoveredPages.length} page
              {discoveredPages.length === 1 ? "" : "s"}.
            </p>
            <div className="flex flex-none gap-3">
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
              const important = isLikelyImportantPage(page.url);
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
                    <span className="flex items-center gap-1.5">
                      <span className="block truncate font-body text-sm text-foreground">
                        {page.title}
                      </span>
                      {important && (
                        <span className="flex-none rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-body text-[9px] font-medium uppercase tracking-wide text-primary">
                          Recommended
                        </span>
                      )}
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
          Adding page {scrapeProgress.index} of {scrapeProgress.total}...
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

// ============================================================
// Files tab — PDF upload with drag & drop
// ============================================================

function FilesAddPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
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
    }

    setPdfStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-3 font-body text-sm font-medium text-foreground">
        Upload a file
      </p>
      <p className="mb-4 font-body text-sm text-secondary-text">
        Menus, brochures, price sheets — up to 10MB, text-based (not a scanned
        image).
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (pdfStatus === "idle") setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (pdfStatus === "idle") {
            handlePdfSelect(e.dataTransfer.files?.[0]);
          }
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-background"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          disabled={pdfStatus !== "idle"}
          onChange={(e) => handlePdfSelect(e.target.files?.[0])}
          className="hidden"
          id="pdf-upload"
        />
        {pdfStatus === "idle" && (
          <>
            <Upload className="h-5 w-5 text-secondary-text" />
            <p className="font-body text-xs text-secondary-text">
              Drag a PDF here, or
            </p>
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 font-body text-xs font-medium text-foreground hover:bg-background"
            >
              Choose file
            </label>
          </>
        )}
        {pdfStatus !== "idle" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-secondary-text" />
            <p className="font-body text-xs text-secondary-text">
              {pdfStatus === "uploading" ? "Uploading..." : "Processing..."}
            </p>
          </>
        )}
      </div>

      {pdfError && (
        <p role="alert" className="mt-3 font-body text-sm text-error">
          {pdfError}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Text tab — freeform manual notes
// ============================================================

function TextAddPanel() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("sourceType", "manual_text");
    startTransition(async () => {
      const result = await addKnowledgeBaseDocument(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleAdd} className="flex flex-col gap-4">
      <p className="font-body text-sm font-medium text-foreground">
        Write a text entry
      </p>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="text-title"
          className="font-body text-sm font-medium text-foreground"
        >
          Title
        </label>
        <input
          id="text-title"
          name="title"
          required
          placeholder="e.g. Pricing & Hours"
          className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="text-content"
          className="font-body text-sm font-medium text-foreground"
        >
          Content
        </label>
        <textarea
          id="text-content"
          name="rawContent"
          required
          rows={5}
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
        Save
      </Button>
    </form>
  );
}

// ============================================================
// Q&A tab — structured question / answer pairs
// ============================================================

function QaAddPanel() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const raw = new FormData(e.currentTarget);
    const question = String(raw.get("question") ?? "").trim();
    const answer = String(raw.get("answer") ?? "").trim();

    if (!question || !answer) {
      setError("Fill in both the question and the answer.");
      return;
    }

    const formData = new FormData();
    formData.set("title", question);
    formData.set("rawContent", `Q: ${question}\nA: ${answer}`);
    formData.set("sourceType", "faq_pair");

    startTransition(async () => {
      const result = await addKnowledgeBaseDocument(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleAdd} className="flex flex-col gap-4">
      <p className="font-body text-sm font-medium text-foreground">
        Add a question &amp; answer
      </p>
      <p className="-mt-2 font-body text-xs text-secondary-text">
        Often the highest-quality source, since there&apos;s no ambiguity about
        what the answer should be.
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="qa-question"
          className="font-body text-sm font-medium text-foreground"
        >
          Question
        </label>
        <input
          id="qa-question"
          name="question"
          required
          placeholder="e.g. Do you offer home delivery?"
          className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="qa-answer"
          className="font-body text-sm font-medium text-foreground"
        >
          Answer
        </label>
        <textarea
          id="qa-answer"
          name="answer"
          required
          rows={3}
          placeholder="e.g. Yes, free delivery within 5km, small fee beyond that."
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
        Add pair
      </Button>
    </form>
  );
}
