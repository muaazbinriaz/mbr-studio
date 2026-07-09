"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { WidgetPreview } from "@/components/platform/WidgetPreview";
import { Button } from "@/components/ui/button";
import { saveBranding } from "@/app/(platform-client)/dashboard/onboarding/actions";

type OrgInfo = {
  name: string;
  primary_color: string;
  accent_color: string;
  welcome_message: string;
  logo_url: string | null;
} | null;

export function AppearanceClient({ org }: { org: OrgInfo }) {
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

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setError(null);
    setSaved(false);
    const formData = new FormData();
    formData.set("primary_color", primaryColor);
    formData.set("accent_color", accentColor);
    formData.set("welcome_message", welcomeMessage);
    formData.set("logo_url", logoUrl);

    startTransition(async () => {
      const result = await saveBranding(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Widget branding
        </h2>

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
            Logo URL <span className="text-secondary-text">(optional)</span>
          </label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-border bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 font-body text-sm text-error">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="animate-spin" />
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

      <div>
        <p className="mb-3 font-body text-sm font-medium text-foreground">
          Preview
        </p>
        <WidgetPreview
          primaryColor={primaryColor}
          businessName={org?.name ?? "Your Business"}
          welcomeMessage={welcomeMessage}
        />
      </div>
    </div>
  );
}
