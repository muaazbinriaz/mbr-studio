"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2, Sparkles, Check, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentTemplate } from "@/lib/agents/templates";
import {
  discoverKnowledgeBaseUrls,
  scrapeForPreview,
  confirmAddScrapedPage,
  addKnowledgeBaseDocument,
  updateKnowledgeBaseDocument,
} from "@/app/(platform-client)/dashboard/knowledge-base/actions";

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  source_type: string;
  chunkCount: number;
};

const MANUAL_TITLE = "Business Info";
const MAX_CHARS = 20000;
const QUICK_SCAN_LIMIT = 5;

// Small, self-contained copy of the "important page" heuristic used in
// KnowledgeBaseClient — duplicated on purpose to keep this panel fully
// decoupled from the advanced tool's internals.
const IMPORTANT_HINTS = [
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

function rankPages(pages: { url: string; title: string }[]) {
  const scored = pages.map((p) => {
    let path = "";
    try {
      path = new URL(p.url).pathname.toLowerCase();
    } catch {
      // ignore malformed URL, treat as low priority
    }
    const important = IMPORTANT_HINTS.some((h) => path.includes(h));
    const isHome = path === "" || path === "/";
    return { ...p, score: isHome ? 2 : important ? 1 : 0 };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, QUICK_SCAN_LIMIT);
}

function statusBadge(status: string) {
  if (status === "error") return <Badge variant="destructive">Failed</Badge>;
  if (status === "processing")
    return <Badge variant="warning">Processing</Badge>;
  return <Badge variant="success">Synced</Badge>;
}

export function TrainQuickPanel({
  documents,
  selectedTemplate,
  onAdvanced,
}: {
  documents: DocumentRow[];
  selectedTemplate: AgentTemplate | null;
  onAdvanced: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // --- Website scan ---
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scanStatus, setScanStatus] = useState<
    "idle" | "scanning" | "done" | "error"
  >("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // --- Manual text ---
  const existingManualDoc = documents.find(
    (d) => d.source_type === "manual_text" && d.title === MANUAL_TITLE,
  );
  const [manualText, setManualText] = useState("");
  const [savedJustNow, setSavedJustNow] = useState(false);

  const handleScan = () => {
    setError(null);
    if (!websiteUrl.trim()) {
      setError("Enter your website URL first.");
      return;
    }
    setScanStatus("scanning");
    setScanMessage("Looking at your site…");

    startTransition(async () => {
      const discovered = await discoverKnowledgeBaseUrls(websiteUrl.trim());
      if (discovered.error || discovered.pages.length === 0) {
        setScanStatus("error");
        setScanMessage(
          discovered.error ?? "We couldn't find any pages on that site.",
        );
        return;
      }

      const picks = rankPages(discovered.pages);
      let added = 0;

      for (let i = 0; i < picks.length; i++) {
        setScanMessage(`Adding page ${i + 1} of ${picks.length}…`);
        const preview = await scrapeForPreview(picks[i].url);
        if (preview.error || !preview.data) continue;
        const saved = await confirmAddScrapedPage(preview.data);
        if (!saved.error) added += 1;
      }

      if (added === 0) {
        setScanStatus("error");
        setScanMessage(
          "We reached your site but couldn't pull any usable content — try pasting it in manually below.",
        );
        return;
      }

      setScanStatus("done");
      setScanMessage(
        `Added ${added} page${added === 1 ? "" : "s"} from your site.`,
      );
    });
  };

  const applyTemplateStarter = () => {
    if (!selectedTemplate) return;
    const joined = selectedTemplate.starterFaqs
      .map((f) => f.content)
      .join("\n\n");
    setManualText((prev) => (prev.trim() ? `${prev}\n\n${joined}` : joined));
  };

  const handleSaveManual = () => {
    setError(null);
    if (!manualText.trim() || manualText.trim().length < 20) {
      setError("Add at least a couple of sentences before saving.");
      return;
    }

    startTransition(async () => {
      const result = existingManualDoc
        ? await updateKnowledgeBaseDocument(existingManualDoc.id, manualText)
        : await (async () => {
            const fd = new FormData();
            fd.set("title", MANUAL_TITLE);
            fd.set("rawContent", manualText);
            fd.set("sourceType", "manual_text");
            return addKnowledgeBaseDocument(fd);
          })();

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 2000);
    });
  };

  const otherDocs = documents.filter(
    (d) => !(d.source_type === "manual_text" && d.title === MANUAL_TITLE),
  );

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p role="alert" className="font-body text-sm text-error">
          {error}
        </p>
      )}

      {/* Website scan */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-1 font-body text-sm font-semibold text-foreground">
          Auto-fill from your website
        </p>
        <p className="mb-3 font-body text-xs text-secondary-text">
          We&apos;ll scan your site and pull in the {QUICK_SCAN_LIMIT} pages
          that matter most — home, pricing, FAQ, contact.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
            <Globe className="h-4 w-4 flex-none text-secondary-text" />
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              disabled={scanStatus === "scanning"}
              className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none disabled:opacity-60"
            />
          </div>
          <Button
            type="button"
            onClick={handleScan}
            disabled={scanStatus === "scanning"}
            className="sm:w-auto"
          >
            {scanStatus === "scanning" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Scan website
          </Button>
        </div>
        {scanMessage && (
          <p
            className={`mt-2.5 font-body text-xs ${
              scanStatus === "error" ? "text-error" : "text-secondary-text"
            }`}
          >
            {scanStatus === "done" && (
              <Check className="mr-1 inline h-3.5 w-3.5 text-success" />
            )}
            {scanMessage}
          </p>
        )}
      </div>

      {/* Template starter */}
      {selectedTemplate && (
        <button
          type="button"
          onClick={applyTemplateStarter}
          className="flex items-center gap-2.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4 flex-none text-primary" />
          <span className="min-w-0 font-body text-sm text-foreground">
            Fill in starter content for{" "}
            <span className="font-semibold">{selectedTemplate.name}</span> —
            edit it below to match your real business.
          </span>
        </button>
      )}

      {/* Manual textarea */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="font-body text-sm font-medium text-foreground">
            Describe your business
          </label>
          <span className="font-body text-[11px] text-secondary-text">
            {manualText.length} / {MAX_CHARS}
          </span>
        </div>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Products, prices, location, hours, FAQs — write it however makes sense. The AI only ever answers from what you put here."
          rows={8}
          className="w-full resize-y rounded-lg border border-border bg-background px-3.5 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="mt-2.5 flex items-center gap-3">
          <Button type="button" onClick={handleSaveManual} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
          {savedJustNow && (
            <span className="font-body text-xs text-success">Saved.</span>
          )}
        </div>
      </div>

      {/* Compact list of what's already added */}
      {otherDocs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2.5 font-body text-xs font-medium text-secondary-text">
            {otherDocs.length} source{otherDocs.length === 1 ? "" : "s"} added
            from your website
          </p>
          <div className="flex flex-col gap-2">
            {otherDocs.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate font-body text-sm text-foreground">
                  {doc.title}
                </span>
                {statusBadge(doc.status)}
              </div>
            ))}
            {otherDocs.length > 6 && (
              <p className="font-body text-xs text-secondary-text">
                +{otherDocs.length - 6} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Escape hatch */}
      <button
        type="button"
        onClick={onAdvanced}
        className="flex items-center gap-1.5 self-start font-body text-xs font-medium text-secondary-text hover:text-foreground"
      >
        Need PDFs, individual page management, or Q&amp;A pairs?
        <span className="inline-flex items-center gap-1 text-primary">
          Advanced <ArrowRight className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}
