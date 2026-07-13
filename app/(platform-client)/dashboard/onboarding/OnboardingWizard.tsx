"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { WidgetPreview } from "@/components/platform/WidgetPreview";
import type { AgentTemplate } from "@/lib/agents/templates";
import type { GuardrailToggles } from "@/lib/agents/build-system-prompt";
import { applyTemplate } from "@/app/(platform-client)/dashboard/agent/templates/actions";
import { KnowledgeBaseClient } from "@/app/(platform-client)/dashboard/knowledge-base/KnowledgeBaseClient";
import { GuardrailsClient } from "@/app/(platform-client)/dashboard/agent/guardrails/GuardrailsClient";
import {
  saveOrgBasics,
  saveAgentName,
  saveBranding,
  saveOnboardingStep,
  markOnboardingComplete,
} from "./actions";
import { Button } from "@/components/ui/button";
import { useRouteLoader } from "@/components/loader/RouteLoader";

type OrgInfo = {
  name: string;
  primary_color: string;
  accent_color: string;
  welcome_message: string;
  logo_url: string | null;
  widget_position: string;
} | null;

interface LeadCaptureSettings {
  ask_name: boolean;
  ask_email: boolean;
  ask_phone: boolean;
  ask_message: boolean;
}

interface DocumentRow {
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
}

const STEPS = [
  "Name & Personality",
  "Train",
  "Behavior",
  "Look & Feel",
  "Go live",
] as const;
const EMBED_TABS = ["HTML", "WordPress", "Wix", "Webflow"] as const;

export function OnboardingWizard({
  org,
  alreadyLive = false,
  agentName: initialAgentName,
  publicKey,
  templates,
  initialStep,
  guardrails,
  leadCaptureSettings,
  documents,
}: {
  org: OrgInfo;
  alreadyLive?: boolean;
  agentId: string | null;
  agentName: string;
  publicKey: string | null;
  templates: AgentTemplate[];
  initialStep: number;
  guardrails: GuardrailToggles | null;
  leadCaptureSettings: LeadCaptureSettings | null;
  documents: DocumentRow[];
}) {
  const { start } = useRouteLoader();
  const [step, setStep] = useState(initialStep);
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [agentName, setAgentName] = useState(initialAgentName);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const [primaryColor, setPrimaryColor] = useState(
    org?.primary_color ?? "#6366f1",
  );
  const [accentColor, setAccentColor] = useState(
    org?.accent_color ?? "#06b6d4",
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    org?.welcome_message ?? "Hi! How can I help you today?",
  );
  const [logoUrl, setLogoUrl] = useState(org?.logo_url ?? "");
  const [widgetPosition, setWidgetPosition] = useState<
    "bottom-right" | "bottom-left"
  >((org?.widget_position as "bottom-right" | "bottom-left") ?? "bottom-right");

  const [embedTab, setEmbedTab] = useState<(typeof EMBED_TABS)[number]>("HTML");
  const [copied, setCopied] = useState(false);

  // Fire-and-forget: persists the step server-side so closing the tab and
  // coming back to /dashboard resumes here instead of restarting at 0.
  // Never blocks navigation on this — it's a convenience, not a gate.
  const persistStep = (n: number) => {
    void saveOnboardingStep(n);
  };

  const goNext = () =>
    setStep((s) => {
      const next = Math.min(s + 1, STEPS.length - 1);
      persistStep(next);
      return next;
    });
  const goBack = () =>
    setStep((s) => {
      const prev = Math.max(s - 1, 0);
      persistStep(prev);
      return prev;
    });

  const embedSnippet = publicKey
    ? `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/chatbot.js" data-client="${publicKey}" defer></script>`
    : "";

  const handleStep0Next = () => {
    setError(null);
    if (!agentName.trim()) {
      setError("Give your agent a name.");
      return;
    }

    startTransition(async () => {
      const orgFormData = new FormData();
      orgFormData.set("name", agentName);
      const orgResult = await saveOrgBasics(orgFormData);
      if (orgResult?.error) {
        setError(orgResult.error);
        return;
      }

      const nameResult = await saveAgentName(agentName);
      if (nameResult?.error) {
        setError(nameResult.error);
        return;
      }

      if (selectedTemplateId) {
        const templateResult = await applyTemplate(selectedTemplateId);
        if (templateResult?.error) {
          setError(templateResult.error);
          return;
        }
      }

      goNext();
    });
  };

  const handleBrandingNext = () => {
    setError(null);
    const formData = new FormData();
    formData.set("primary_color", primaryColor);
    formData.set("accent_color", accentColor);
    formData.set("welcome_message", welcomeMessage);
    formData.set("logo_url", logoUrl);
    formData.set("widget_position", widgetPosition);

    startTransition(async () => {
      const result = await saveBranding(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      goNext();
    });
  };

  const handleFinish = () => {
    setError(null);
    start(); // show the top progress bar immediately, same feel as before
    startTransition(async () => {
      const result = await markOnboardingComplete();
      // On success, markOnboardingComplete() redirects server-side — this
      // component unmounts before execution reaches past that call, so
      // only the error path is ever actually reached here.
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Opens a genuinely blank page and injects the real embed snippet, so the
  // user sees the widget work outside the dashboard too — not a simulation.
  const openLiveTest = () => {
    if (!embedSnippet) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>Widget test</title></head><body style="font-family:sans-serif;padding:48px;color:#333"><h1>This is a blank page</h1><p>Your chat widget should appear in the corner below — this is exactly how it'll look on your real site.</p>${embedSnippet}</body></html>`,
    );
    win.document.close();
  };

  // Steps 1 (Train) and 2 (Behavior) embed the full Knowledge Base /
  // Guardrails settings components, which are built for full page width.
  // Squeezing them into the 55% left column — to make room for a "live
  // preview" pane that doesn't even reflect KB or guardrail changes — is
  // what breaks their internal layout. Only show the preview on steps
  // where WidgetPreview's props actually change.
  const showPreview = step !== 1 && step !== 2;

  return (
    <div>
      {/* ---------- Already‑live banner ---------- */}
      {alreadyLive && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
          <span className="text-base">ℹ️</span>
          <p className="font-body text-xs text-secondary-text">
            Your agent is already live — changes you make here update it
            directly. Nothing will be lost.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full font-body text-xs font-semibold transition-colors duration-200 ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-secondary-text"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`hidden font-body text-xs sm:block ${i === step ? "font-medium text-foreground" : "text-secondary-text"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {/* Mobile-only Setup/Preview toggle — hidden on steps with no live
          preview to switch to (Train, Behavior). */}
      {showPreview && (
        <div className="mb-4 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView("form")}
            className={`flex-1 rounded-lg px-3 py-2 font-body text-xs font-medium transition-colors ${
              mobileView === "form"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-secondary-text"
            }`}
          >
            Setup
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={`flex-1 rounded-lg px-3 py-2 font-body text-xs font-medium transition-colors ${
              mobileView === "preview"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-secondary-text"
            }`}
          >
            Preview
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 font-body text-sm text-error">
          {error}
        </p>
      )}

      <div
        className={`grid grid-cols-1 gap-6 ${showPreview ? "lg:grid-cols-[55fr_45fr]" : ""}`}
      >
        {/* Left: steps */}
        <div
          className={
            showPreview && mobileView === "preview" ? "hidden lg:block" : ""
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="gradient-ring rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              {step === 0 && (
                <div>
                  <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                    Name your agent
                  </h2>
                  <p className="mb-6 font-body text-sm text-secondary-text">
                    Pick a name and a starting template — watch it come alive on
                    the right.
                  </p>

                  <div className="mb-6 flex flex-col gap-1.5">
                    <label className="font-body text-sm font-medium text-foreground">
                      Agent name
                    </label>
                    <input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g. Aria, Sam, Support Bot"
                      className="rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <p className="mb-3 font-body text-sm font-medium text-foreground">
                    Choose a starting template (optional)
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`rounded-xl border p-4 text-left transition-colors duration-150 ${
                          selectedTemplateId === template.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-body text-sm font-semibold text-foreground">
                          {template.name}
                        </p>
                        <p className="mt-1 font-body text-xs text-secondary-text">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 font-body text-xs text-secondary-text">
                    A template pre-fills starter FAQs and behavior — you can
                    change everything later.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                    Add what your AI should know
                  </h2>
                  <p className="mb-4 font-body text-sm text-secondary-text">
                    Scan your website, upload files, or type it in directly —
                    this is the real Knowledge Base, not a simplified copy.
                  </p>
                  <div className="h-[min(75vh,680px)] min-h-[560px] overflow-y-auto rounded-xl border border-border">
                    <KnowledgeBaseClient documents={documents} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                    Set how it behaves
                  </h2>
                  <p className="mb-4 font-body text-sm text-secondary-text">
                    Tone, guardrails, and lead capture — save your changes
                    below, then continue.
                  </p>
                  <GuardrailsClient
                    guardrails={guardrails}
                    leadCaptureSettings={leadCaptureSettings}
                    orgName={agentName || "Your Business"}
                  />
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                    Make it match your brand
                  </h2>
                  <p className="mb-6 font-body text-sm text-secondary-text">
                    These are used in your live chat widget — watch the preview
                    update.
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-body text-sm font-medium text-foreground">
                        Primary color
                      </label>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-full cursor-pointer rounded-lg border border-border bg-background"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-body text-sm font-medium text-foreground">
                        Accent color
                      </label>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-full cursor-pointer rounded-lg border border-border bg-background"
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex flex-col gap-1.5">
                    <label className="font-body text-sm font-medium text-foreground">
                      Welcome message
                    </label>
                    <input
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="mb-4 flex flex-col gap-1.5">
                    <label className="font-body text-sm font-medium text-foreground">
                      Logo URL{" "}
                      <span className="text-secondary-text">(optional)</span>
                    </label>
                    <input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-sm font-medium text-foreground">
                      Widget position
                    </label>
                    <div className="flex gap-2">
                      {(["bottom-right", "bottom-left"] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setWidgetPosition(pos)}
                          className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                            widgetPosition === pos
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-secondary-text hover:text-foreground"
                          }`}
                        >
                          {pos === "bottom-right"
                            ? "Bottom right"
                            : "Bottom left"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                    You&apos;re ready to go live
                  </h2>
                  <p className="mb-6 font-body text-sm text-secondary-text">
                    Paste this snippet into your website to embed the chat
                    widget.
                  </p>

                  <div className="mb-4 flex gap-2">
                    {EMBED_TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setEmbedTab(tab)}
                        className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                          embedTab === tab
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-secondary-text hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {publicKey ? (
                    <>
                      <div className="mb-2 flex items-start justify-between gap-2 rounded-lg bg-background p-4">
                        <code className="whitespace-pre-wrap break-all font-mono text-xs text-foreground">
                          {embedSnippet}
                        </code>
                        <button
                          type="button"
                          onClick={copyEmbed}
                          aria-label="Copy embed snippet"
                          className="flex-none rounded-md p-1.5 text-secondary-text hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {copied && (
                        <p className="mb-4 font-body text-xs text-success">
                          Copied.
                        </p>
                      )}

                      <div className="rounded-lg border border-border bg-background p-4 font-body text-xs leading-relaxed text-secondary-text">
                        {embedTab === "HTML" && (
                          <p>
                            Paste this snippet right before the closing{" "}
                            <code>&lt;/body&gt;</code> tag of your site.
                          </p>
                        )}
                        {embedTab === "WordPress" && (
                          <p>
                            Go to Appearance → Theme File Editor → footer.php,
                            and paste this snippet right before{" "}
                            <code>&lt;/body&gt;</code>. Or use a
                            &quot;Header/Footer scripts&quot; plugin instead of
                            editing theme files directly.
                          </p>
                        )}
                        {embedTab === "Wix" && (
                          <p>
                            Go to Settings → Custom Code → Add Custom Code,
                            paste this snippet, set it to load on all pages,
                            placed at the end of the body.
                          </p>
                        )}
                        {embedTab === "Webflow" && (
                          <p>
                            Go to Project Settings → Custom Code → Footer Code,
                            paste this snippet, then publish your site.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={openLiveTest}
                        className="mt-4 inline-flex items-center gap-1.5 font-body text-sm font-medium text-primary underline underline-offset-2"
                      >
                        Test it live on a blank page
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>

                      <p className="mt-6 font-body text-sm text-foreground">
                        Want to lock the widget to your domain only? Head to{" "}
                        <a
                          href="/dashboard/settings"
                          className="text-primary underline underline-offset-2"
                        >
                          Settings
                        </a>{" "}
                        to verify domain ownership — the widget works everywhere
                        until then.
                      </p>
                    </>
                  ) : (
                    <p className="font-body text-sm text-secondary-text">
                      No embed key found yet for your agent — contact support if
                      this persists.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || isPending}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={
                  step === 0
                    ? handleStep0Next
                    : step === 3
                      ? handleBrandingNext
                      : goNext
                }
                disabled={isPending || (step === 0 && !agentName.trim())}
              >
                {isPending ? <Loader2 className="animate-spin" /> : null}
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                Go live
              </Button>
            )}
          </div>
        </div>

        {/* Right: persistent live preview — only on steps where it
            reflects something the user just changed. */}
        {showPreview && (
          <div className={mobileView === "form" ? "hidden lg:block" : ""}>
            <div className="lg:sticky lg:top-24">
              <p className="mb-3 font-body text-sm font-medium text-foreground">
                Live preview
              </p>
              <WidgetPreview
                primaryColor={primaryColor}
                businessName={agentName || "Your Business"}
                welcomeMessage={welcomeMessage}
                logoUrl={logoUrl}
                position={widgetPosition}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
