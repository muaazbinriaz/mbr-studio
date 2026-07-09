// components/platform/Skeleton.tsx
// Shared skeleton building blocks for every dashboard/admin loading.tsx.
// Uses bg-foreground/10 so a single class works correctly in both the
// light and dark theme without any extra dark: overrides.
import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
    />
  );
}

// Title + one-line description, matching every page's real <h1>/<p> header.
export function SkeletonPageHeader({
  descriptionWidth = "w-full max-w-md",
}: {
  descriptionWidth?: string;
}) {
  return (
    <div>
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className={cn("mt-3 h-4", descriptionWidth)} />
    </div>
  );
}

// Matches StatCard's real markup (icon chip + label + value).
export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <SkeletonBlock className="h-9 w-9 rounded-xl" />
      <SkeletonBlock className="mt-4 h-3 w-20" />
      <SkeletonBlock className="mt-2 h-6 w-14" />
    </div>
  );
}

export function SkeletonStatGrid({
  count = 4,
  gridClassName = "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  gridClassName?: string;
}) {
  return (
    <div className={cn("mt-8 grid", gridClassName)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

// One row inside a divided rounded-2xl list (clients, orgs, leads, api keys...).
export function SkeletonListRow() {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="min-w-0 flex-1">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-2 h-3 w-24" />
      </div>
      <SkeletonBlock className="h-6 w-16 flex-none rounded-full" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}

// A single big form/panel card — guardrails, appearance, channels, settings...
export function SkeletonPanel({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-6", className)}
    >
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="mt-4 h-10 w-full" />
      <SkeletonBlock className="mt-3 h-10 w-full" />
      <SkeletonBlock className="mt-3 h-10 w-2/3" />
    </div>
  );
}

// Matches the icon-less inline stat cards used directly in a page (not
// the shared StatCard component) — e.g. clients/[id]/page.tsx's
// "Agent / KB documents / Conversations" cards, which are just a label
// + value with no icon chip. Kept separate from SkeletonStatCard so we
// don't overshoot height on pages that don't have an icon.
export function SkeletonMiniStatCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="mt-2 h-5 w-12" />
    </div>
  );
}

export function SkeletonMiniStatGrid({
  count = 3,
  gridClassName = "grid-cols-1 gap-4 sm:grid-cols-3",
}: {
  count?: number;
  gridClassName?: string;
}) {
  return (
    <div className={cn("mt-8 grid", gridClassName)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMiniStatCard key={i} />
      ))}
    </div>
  );
}

// Row of action buttons, matching CTA rows like the dashboard overview's
// "Manage Knowledge Base / Go to Inbox" links.
export function SkeletonButtonRow({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-9 w-40 rounded-lg" />
      ))}
    </div>
  );
}

// Back link + h1 + badge, for detail pages (clients/[id], organizations/[id]).
export function SkeletonDetailHeader() {
  return (
    <div>
      <SkeletonBlock className="h-4 w-32" />
      <div className="mt-4 flex items-center gap-3">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="mt-2 h-3 w-40" />
    </div>
  );
}

// Two-pane split layout for inbox/knowledge-base (full-height list + detail).
export function SkeletonSplitPane() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="flex w-full max-w-xs flex-none flex-col gap-3 rounded-2xl border border-border bg-card p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-2">
            <SkeletonBlock className="h-9 w-9 flex-none rounded-full" />
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-3 w-3/4" />
              <SkeletonBlock className="mt-2 h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-4">
        <SkeletonBlock className="h-5 w-40" />
        <div className="mt-6 flex flex-col gap-3">
          <SkeletonBlock className="h-10 w-2/3 self-end rounded-2xl" />
          <SkeletonBlock className="h-10 w-1/2 rounded-2xl" />
          <SkeletonBlock className="h-10 w-3/5 self-end rounded-2xl" />
        </div>
      </div>
    </div>
  );
}