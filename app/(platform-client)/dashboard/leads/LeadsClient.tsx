"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Mail,
  Phone,
  MessageSquareText,
  UsersRound,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

type Lead = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  notes: string | null;
  captured_at: string;
  conversation_id: string | null;
};

export function LeadsClient({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return leads;
    const q = query.toLowerCase();
    return leads.filter((lead) =>
      [lead.visitor_name, lead.visitor_email, lead.visitor_phone, lead.notes]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [leads, query]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UsersRound className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-body text-sm font-medium text-foreground">
            No leads yet
          </p>
          <p className="mt-1 max-w-sm font-body text-sm text-secondary-text">
            Leads show up automatically once a visitor shares their name, email,
            or phone with your agent. Make sure your widget is live on your site
            to start capturing them.
          </p>
        </div>
        <Link
          href="/dashboard/onboarding"
          className="mt-1 rounded-lg bg-primary px-4 py-2 font-body text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get your embed code
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leads..."
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {filtered.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-foreground">
                {lead.visitor_name || "Unnamed visitor"}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-secondary-text">
                {lead.visitor_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {lead.visitor_email}
                  </span>
                )}
                {lead.visitor_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {lead.visitor_phone}
                  </span>
                )}
              </div>
              {lead.notes && (
                <p className="mt-2 flex items-start gap-1.5 font-body text-xs text-secondary-text">
                  <MessageSquareText className="mt-0.5 h-3 w-3 flex-none" />
                  {lead.notes}
                </p>
              )}
            </div>
            <span className="flex-none font-body text-xs text-secondary-text">
              {formatDate(lead.captured_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
