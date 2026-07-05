"use client";

import type { DailyAnalyticsPoint } from "@/lib/analytics/queries";

export function AnalyticsChart({ data }: { data: DailyAnalyticsPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.conversations));

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-6 font-heading text-sm font-semibold text-foreground">
        Conversations — last {data.length} days
      </p>
      <div className="flex h-40 items-end gap-1">
        {data.map((point) => {
          const heightPct =
            point.conversations === 0
              ? 2
              : Math.max(6, (point.conversations / max) * 100);
          return (
            <div
              key={point.date}
              className="group relative h-full flex-1"
              title={`${point.date}: ${point.conversations} conversations`}
            >
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-primary/70 transition-colors duration-150 group-hover:bg-primary"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between font-body text-[10px] text-secondary-text">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
