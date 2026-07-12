"use client";

import { useState } from "react";
import type { DailyAnalyticsPoint } from "@/lib/analytics/queries";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsChart({ data }: { data: DailyAnalyticsPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.conversations));
  const total = data.reduce((sum, d) => sum + d.conversations, 0);

  // Peak day drives the default "selected" value shown above the chart —
  // more useful than always defaulting to day 1, and gives mobile users
  // (who can't hover) something meaningful before they've tapped anything.
  const peakIndex = data.reduce(
    (best, d, i) => (d.conversations > data[best].conversations ? i : best),
    0,
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(
    total > 0 ? peakIndex : null,
  );

  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="font-heading text-sm font-semibold text-foreground">
          Conversations — last {data.length} days
        </p>
        {/* Always-visible value readout — replaces the old title-attribute
            tooltip, which never fires on touch devices. Tapping/hovering a
            bar updates this; nothing selected only when there's no data. */}
        <div className="text-right">
          {active ? (
            <>
              <p className="font-heading text-sm font-semibold text-foreground">
                {active.conversations.toLocaleString()}{" "}
                <span className="font-body text-xs font-normal text-secondary-text">
                  conversations
                </span>
              </p>
              <p className="font-body text-[11px] text-secondary-text">
                {formatDate(active.date)}
              </p>
            </>
          ) : (
            <p className="font-body text-xs text-secondary-text">
              No conversations yet
            </p>
          )}
        </div>
      </div>

      {/* overflow-x-auto + min-width keeps each bar a real touch target
          (min 10px) on narrow screens instead of squishing 30 bars into
          ~200px. Scrolls horizontally on small phones, sits flush on
          everything sm+ wide enough to fit naturally. */}
      <div className="overflow-x-auto">
        <div
          className="flex h-40 items-end gap-1"
          style={{ minWidth: data.length * 10 }}
          role="img"
          aria-label={`Bar chart of conversations per day over the last ${data.length} days, totaling ${total} conversations`}
        >
          {data.map((point, i) => {
            const heightPct =
              point.conversations === 0
                ? 2
                : Math.max(6, (point.conversations / max) * 100);
            const isActive = activeIndex === i;
            return (
              <button
                key={point.date}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                onClick={() => setActiveIndex(i)}
                className="group relative h-full flex-1 min-w-[8px] cursor-pointer rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${formatDate(point.date)}: ${point.conversations} conversations`}
              >
                <div
                  className={`absolute bottom-0 w-full rounded-t-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-primary"
                      : "bg-primary/70 group-hover:bg-primary"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-between font-body text-[10px] text-secondary-text">
        <span>{data[0] ? formatDate(data[0].date) : ""}</span>
        <span>
          {data[data.length - 1] ? formatDate(data[data.length - 1].date) : ""}
        </span>
      </div>
    </div>
  );
}
