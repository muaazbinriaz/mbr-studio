"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Save, Check } from "lucide-react";

import {
  buildGuardrailInstructions,
  type GuardrailToggles,
} from "@/lib/agents/build-system-prompt";
import { saveGuardrails } from "./actions";
import { Button } from "@/components/ui/button";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "fun", label: "Fun" },
  { value: "concise", label: "Concise" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Match visitor's language" },
  { value: "English", label: "Always English" },
  { value: "Urdu", label: "Always Urdu" },
  { value: "Arabic", label: "Always Arabic" },
] as const;

const PRESETS: {
  id: string;
  label: string;
  description: string;
  values: Partial<GuardrailToggles>;
}[] = [
  {
    id: "strict",
    label: "Strict & Professional",
    description:
      "Formal tone, no opinions, always pushes to contact for anything tricky.",
    values: {
      tone: "professional",
      stay_on_topic: true,
      no_competitors: true,
      no_pricing: true,
      no_refund_promise: true,
      no_opinions: true,
      always_polite: true,
      push_contact: true,
      capture_leads: true,
    },
  },
  {
    id: "friendly",
    label: "Friendly & Casual",
    description:
      "Warm, casual tone, more relaxed about staying strictly on-topic.",
    values: {
      tone: "friendly",
      stay_on_topic: false,
      no_competitors: true,
      no_pricing: false,
      no_refund_promise: true,
      no_opinions: false,
      always_polite: true,
      push_contact: false,
      capture_leads: true,
    },
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "A safe middle ground — professional but approachable.",
    values: {
      tone: "professional",
      stay_on_topic: true,
      no_competitors: true,
      no_pricing: true,
      no_refund_promise: true,
      no_opinions: true,
      always_polite: true,
      push_contact: false,
      capture_leads: true,
    },
  },
];

const TOGGLE_DEFS: {
  key: keyof GuardrailToggles;
  label: string;
  description: string;
}[] = [
  {
    key: "stay_on_topic",
    label: "Stay on topic",
    description:
      "Decline unrelated questions and redirect back to the business.",
  },
  {
    key: "no_competitors",
    label: "No competitor mentions",
    description: "Never mention or recommend competing businesses.",
  },
  {
    key: "no_pricing",
    label: "No pricing",
    description:
      "Never state specific prices, even if they're in the knowledge base.",
  },
  {
    key: "no_refund_promise",
    label: "No refund promises",
    description: "Never commit to a refund, return, or binding policy.",
  },
  {
    key: "no_opinions",
    label: "No personal opinions",
    description: "Stick to facts, never share subjective opinions.",
  },
  {
    key: "always_polite",
    label: "Always polite",
    description: "Stay calm and courteous even if the visitor is rude.",
  },
  {
    key: "push_contact",
    label: "Push to contact",
    description:
      "Encourage visitors to reach out directly for anything non-trivial.",
  },
  {
    key: "capture_leads",
    label: "Capture leads",
    description:
      "When the AI can&apos;t answer, show a quick contact-info form.",
  },
];

interface LeadCaptureSettings {
  ask_name: boolean;
  ask_email: boolean;
  ask_phone: boolean;
  ask_message: boolean;
}

const DEFAULT_LEAD_SETTINGS: LeadCaptureSettings = {
  ask_name: true,
  ask_email: true,
  ask_phone: false,
  ask_message: false,
};

const LEAD_FIELD_DEFS: { key: keyof LeadCaptureSettings; label: string }[] = [
  { key: "ask_name", label: "Ask for name" },
  { key: "ask_email", label: "Ask for email" },
  { key: "ask_phone", label: "Ask for phone" },
  { key: "ask_message", label: "Ask for a message" },
];

type GuardrailsRow = GuardrailToggles | null;

export function GuardrailsClient({
  guardrails,
  leadCaptureSettings,
  orgName,
}: {
  guardrails: GuardrailsRow;
  leadCaptureSettings: LeadCaptureSettings | null;
  orgName: string;
}) {
  const [state, setState] = useState<GuardrailToggles>(() => ({
    no_competitors: guardrails?.no_competitors ?? false,
    stay_on_topic: guardrails?.stay_on_topic ?? true,
    no_pricing: guardrails?.no_pricing ?? false,
    always_polite: guardrails?.always_polite ?? true,
    no_opinions: guardrails?.no_opinions ?? false,
    push_contact: guardrails?.push_contact ?? false,
    no_refund_promise: guardrails?.no_refund_promise ?? false,
    capture_leads: guardrails?.capture_leads ?? true,
    custom_rules: guardrails?.custom_rules ?? "",
    tone: guardrails?.tone ?? "professional",
    reply_language: guardrails?.reply_language ?? "auto",
  }));

  const [leadSettings, setLeadSettings] = useState<LeadCaptureSettings>(
    leadCaptureSettings ?? DEFAULT_LEAD_SETTINGS,
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setState((prev) => ({ ...prev, ...preset.values }));
    setSelectedPreset(presetId);
    setSaved(false);
  };

  const preview = useMemo(
    () => buildGuardrailInstructions(state, orgName),
    [state, orgName],
  );

  const toggle = (key: keyof GuardrailToggles) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const toggleLeadField = (key: keyof LeadCaptureSettings) => {
    setLeadSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setError(null);
    const formData = new FormData();
    for (const def of TOGGLE_DEFS) {
      if (state[def.key]) formData.set(def.key, "on");
    }
    formData.set("tone", state.tone);
    formData.set("reply_language", state.reply_language);
    formData.set("custom_rules", state.custom_rules ?? "");
    for (const def of LEAD_FIELD_DEFS) {
      if (leadSettings[def.key]) formData.set(`lead_${def.key}`, "on");
    }

    startTransition(async () => {
      try {
        const result = await saveGuardrails(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setSaved(true);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "An unexpected error occurred.",
        );
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
            Quick presets
          </h2>
          <p className="mb-4 font-body text-xs text-secondary-text">
            Pick a starting point — you can still fine-tune anything below.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-xl border p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50 hover:bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body text-sm font-medium text-foreground">
                      {preset.label}
                    </p>
                    {isSelected && (
                      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-body text-xs text-secondary-text">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-left font-body text-sm font-medium text-primary hover:underline"
        >
          {showAdvanced ? "Hide" : "Show"} advanced rules & customization
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: showAdvanced ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-6 pt-6">
              <div className="overflow-hidden rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
                  Rules
                </h2>
                <div className="flex flex-col divide-y divide-border">
                  {TOGGLE_DEFS.map((def) => (
                    <label
                      key={def.key}
                      className="flex cursor-pointer items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {def.label}
                        </p>
                        <p className="mt-0.5 font-body text-xs text-secondary-text">
                          {def.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(state[def.key])}
                        onClick={() => toggle(def.key)}
                        className={`relative h-6 w-11 flex-none rounded-full transition-colors duration-200 ${
                          state[def.key] ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            state[def.key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              {state.capture_leads && (
                <div className="overflow-hidden rounded-2xl border border-border bg-card p-6">
                  <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
                    Lead capture form fields
                  </h2>
                  <p className="mb-4 font-body text-xs text-secondary-text">
                    Which fields the widget&apos;s quick contact form asks for.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {LEAD_FIELD_DEFS.map((def) => (
                      <label
                        key={def.key}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={leadSettings[def.key]}
                          onChange={() => toggleLeadField(def.key)}
                          className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
                        />
                        <span className="font-body text-sm text-foreground">
                          {def.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
                  Tone & language
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="tone"
                      className="font-body text-sm font-medium text-foreground"
                    >
                      Tone
                    </label>
                    <select
                      id="tone"
                      value={state.tone}
                      onChange={(e) => {
                        setState((p) => ({ ...p, tone: e.target.value }));
                        setSaved(false);
                      }}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {TONE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reply_language"
                      className="font-body text-sm font-medium text-foreground"
                    >
                      Reply language
                    </label>
                    <select
                      id="reply_language"
                      value={state.reply_language}
                      onChange={(e) => {
                        setState((p) => ({
                          ...p,
                          reply_language: e.target.value,
                        }));
                        setSaved(false);
                      }}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {LANGUAGE_OPTIONS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
                  Custom rules
                </h2>
                <p className="mb-3 font-body text-xs text-secondary-text">
                  Anything else the AI should always follow, in plain English.
                </p>
                <textarea
                  rows={4}
                  value={state.custom_rules ?? ""}
                  onChange={(e) => {
                    setState((p) => ({ ...p, custom_rules: e.target.value }));
                    setSaved(false);
                  }}
                  placeholder="e.g. Always mention we're closed on Fridays."
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="font-body text-sm text-error">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </Button>
          {saved && !isPending && (
            <span className="font-body text-sm text-success">Saved.</span>
          )}
        </div>
      </div>

      <div className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-6">
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-secondary-text">
          Here&apos;s what your AI will be told
        </h2>
        <p className="mb-3 font-body text-xs text-secondary-text">
          Plain-English instructions your agent follows, based on your settings
          above.
        </p>
        <pre className="whitespace-pre-wrap rounded-lg bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
          {preview}
        </pre>
      </div>
    </div>
  );
}
