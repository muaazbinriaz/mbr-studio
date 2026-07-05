"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Check } from "lucide-react";

import type { AgentTemplate } from "@/lib/agents/templates";
import { applyTemplate } from "./actions";
import { Button } from "@/components/ui/button";

export function TemplatesClient({ templates }: { templates: AgentTemplate[] }) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = (templateId: string) => {
    setError(null);
    setActiveId(templateId);
    startTransition(async () => {
      const result = await applyTemplate(templateId);
      setActiveId(null);
      if (result?.error) {
        setError(result.error);
      } else {
        setAppliedId(templateId);
      }
    });
  };

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 font-body text-sm text-error">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isThisPending = isPending && activeId === template.id;
          const isApplied = appliedId === template.id;
          return (
            <div
              key={template.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mb-1.5 font-heading text-base font-semibold text-foreground">
                {template.name}
              </h3>
              <p className="mb-5 flex-1 font-body text-sm leading-relaxed text-secondary-text">
                {template.description}
              </p>
              <Button
                onClick={() => handleApply(template.id)}
                disabled={isPending}
                variant={isApplied ? "outline" : "default"}
              >
                {isThisPending ? (
                  <Loader2 className="animate-spin" />
                ) : isApplied ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {isApplied ? "Applied" : "Use this template"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
