"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

import type { AgentTemplate } from "@/lib/agents/templates";
import { applyTemplate } from "@/app/(platform-client)/dashboard/agent/templates/actions";
import { addKnowledgeBaseDocument } from "@/app/(platform-client)/dashboard/knowledge-base/actions";
import { saveOrgBasics, saveBranding, markOnboardingComplete } from "./actions";
import { Button } from "@/components/ui/button";
import { useLoaderRouter } from "@/components/loader/RouteLoader";

type OrgInfo = {
  name: string;
  primary_color: string;
  accent_color: string;
  welcome_message: string;
  logo_url: string | null;
} | null;

const STEPS = [
  "Business basics",
  "Knowledge base",
  "Branding",
  "Go live",
] as const;
const EMBED_TABS = ["HTML", "WordPress", "Wix", "Webflow"] as const;

export function OnboardingWizard({
  org,
  publicKey,
  templates,
}: {
  org: OrgInfo;
  agentId: string | null;
  publicKey: string | null;
  templates: AgentTemplate[];
}) {
  const router = useLoaderRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState(org?.name ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const [kbContent, setKbContent] = useState("");

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

  const [embedTab, setEmbedTab] = useState<(typeof EMBED_TABS)[number]>("HTML");
  const [copied, setCopied] = useState(false);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const embedSnippet = publicKey
    ? `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/chatbot.js" data-client="${publicKey}" defer></script>`
    : "";

  const handleStep1Next = () => {
    setError(null);
    const formData = new FormData();
    formData.set("name", businessName);

    startTransition(async () => {
      const result = await saveOrgBasics(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }

      if (selectedTemplateId) {
        const templateResult = await applyTemplate(selectedTemplateId);
        if (templateResult?.error) {
          setError(templateResult.error);
          return;
        }
        const template = templates.find((t) => t.id === selectedTemplateId);
        if (template?.starterFaqs[0]) {
          setKbContent(template.starterFaqs[0].content);
        }
      }

      goNext();
    });
  };

  const handleStep2Next = () => {
    setError(null);

    if (!kbContent.trim() || kbContent.trim().length < 20) {
      goNext();
      return;
    }

    const formData = new FormData();
    formData.set("title", "Getting started (from onboarding)");
    formData.set("rawContent", kbContent);

    startTransition(async () => {
      const result = await addKnowledgeBaseDocument(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      goNext();
    });
  };

  const handleStep3Next = () => {
    setError(null);
    const formData = new FormData();
    formData.set("primary_color", primaryColor);
    formData.set("accent_color", accentColor);
    formData.set("welcome_message", welcomeMessage);
    formData.set("logo_url", logoUrl);

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
    startTransition(async () => {
      const result = await markOnboardingComplete();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
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

      {error && (
        <p role="alert" className="mb-4 font-body text-sm text-error">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          {step === 0 && (
            <div>
              <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                Tell us about your business
              </h2>
              <p className="mb-6 font-body text-sm text-secondary-text">
                We&apos;ll use this to set up your AI agent&apos;s starting
                point.
              </p>

              <div className="mb-6 flex flex-col gap-1.5">
                <label className="font-body text-sm font-medium text-foreground">
                  Business name
                </label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
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
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                Add what your AI should know
              </h2>
              <p className="mb-6 font-body text-sm text-secondary-text">
                FAQs, pricing, policies — anything visitors might ask about.
                Edit the example content below or write your own.
              </p>
              <textarea
                rows={10}
                value={kbContent}
                onChange={(e) => setKbContent(e.target.value)}
                placeholder={
                  "Q: What are your hours?\nA: We're open Monday to Saturday, 9am to 6pm."
                }
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="mt-2 font-body text-xs text-secondary-text">
                You can add PDFs or scrape a website too — from the Knowledge
                Base page later.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                  Make it match your brand
                </h2>
                <p className="mb-6 font-body text-sm text-secondary-text">
                  These colors and message are used in your live chat widget.
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

                <div className="flex flex-col gap-1.5">
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
                  <p className="mt-1 font-body text-xs text-secondary-text">
                    File upload is coming soon — paste a hosted image URL for
                    now.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 font-body text-sm font-medium text-foreground">
                  Preview
                </p>
                <div className="relative flex h-80 items-end justify-end rounded-2xl border border-border bg-background p-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="h-6 w-6 rounded-full border-2 border-white" />
                  </div>
                  <div className="absolute bottom-24 right-4 w-64 overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div
                      className="p-3 text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <p className="font-body text-xs font-semibold">
                        {businessName || "Your Business"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 p-3">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#f1f2f6] px-3 py-2 font-body text-xs text-[#14141c]">
                        {welcomeMessage}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
                You&apos;re ready to go live
              </h2>
              <p className="mb-6 font-body text-sm text-secondary-text">
                Paste this snippet into your website to embed the chat widget.
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
                      className="flex-none rounded-md p-1.5 text-secondary-text hover:bg-card hover:text-foreground"
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
                        Go to Appearance → Theme File Editor → footer.php, and
                        paste this snippet right before{" "}
                        <code>&lt;/body&gt;</code>. Or use a &quot;Header/Footer
                        scripts&quot; plugin instead of editing theme files
                        directly.
                      </p>
                    )}
                    {embedTab === "Wix" && (
                      <p>
                        Go to Settings → Custom Code → Add Custom Code, paste
                        this snippet, set it to load on all pages, placed at the
                        end of the body.
                      </p>
                    )}
                    {embedTab === "Webflow" && (
                      <p>
                        Go to Project Settings → Custom Code → Footer Code,
                        paste this snippet, then publish your site.
                      </p>
                    )}
                  </div>

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
                ? handleStep1Next
                : step === 1
                  ? handleStep2Next
                  : handleStep3Next
            }
            disabled={isPending || (step === 0 && !businessName.trim())}
          >
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Go to dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
