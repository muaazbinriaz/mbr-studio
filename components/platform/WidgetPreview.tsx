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
}: {
  primaryColor: string;
  businessName: string;
  welcomeMessage: string;
}) {
  return (
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
