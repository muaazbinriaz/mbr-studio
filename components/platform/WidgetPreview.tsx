// components/platform/WidgetPreview.tsx
//
// Shared static preview of the client's embeddable chat widget. Extracted
// from AppearanceClient.tsx and OnboardingWizard.tsx, which previously
// duplicated this exact markup (see design-token audit).
//
// Intentionally light-mode-only and hardcoded (`bg-white`, `#f1f2f6`,
// `#14141c`) — this simulates how the widget renders on the CLIENT's own
// site, so it must not follow the studio dashboard's own dark/light theme.
export function WidgetPreview({
  primaryColor,
  businessName,
  welcomeMessage,
  logoUrl,
  position = "bottom-right",
}: {
  primaryColor: string;
  businessName: string;
  welcomeMessage: string;
  logoUrl?: string | null;
  position?: "bottom-right" | "bottom-left";
}) {
  const isLeft = position === "bottom-left";

  return (
    <div className="relative flex h-80 items-end rounded-2xl border border-border bg-background p-4">
      <div
        className={`absolute bottom-4 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${
          isLeft ? "left-4" : "right-4"
        }`}
        style={{ backgroundColor: primaryColor }}
      >
        <div className="h-6 w-6 rounded-full border-2 border-white" />
      </div>
      <div
        className={`absolute bottom-24 w-64 overflow-hidden rounded-2xl bg-white shadow-2xl ${
          isLeft ? "left-4" : "right-4"
        }`}
      >
        <div
          className="flex items-center gap-2 p-3 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-5 w-5 flex-none rounded-full object-cover"
            />
          ) : null}
          <p className="font-body text-xs font-semibold">{businessName}</p>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#f1f2f6] px-3 py-2 font-body text-xs text-[#14141c]">
            {welcomeMessage}
          </div>
        </div>
      </div>
    </div>
  );
}
