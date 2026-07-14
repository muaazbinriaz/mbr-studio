// components/platform/WidgetPreview.tsx
//
// Shared static preview of the client's embeddable chat widget. Extracted
// from AppearanceClient.tsx and OnboardingWizard.tsx, which previously
// duplicated this exact markup (see design-token audit).
//
// Intentionally light-mode-only and hardcoded (bg-white, #f1f2f6,
// #14141c, #e4e4ec) — this simulates how the widget renders on the
// CLIENT's own site, so nothing here should follow the studio
// dashboard's own dark/light theme. The fake browser chrome + page
// skeleton below exist purely so this reads as "a real website with
// your widget on it" instead of an empty box.
export function WidgetPreview({
  primaryColor,
  businessName,
  welcomeMessage,
  logoUrl,
  position = "bottom-right",
  suggestionChips = [],
}: {
  primaryColor: string;
  businessName: string;
  welcomeMessage: string;
  logoUrl?: string | null;
  position?: "bottom-right" | "bottom-left";
  /** Optional starter questions (e.g. from the selected template) shown
   * under the welcome bubble — gives instant visual feedback when the
   * user picks a template, instead of the preview staying static. */
  suggestionChips?: string[];
}) {
  const isLeft = position === "bottom-left";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4e4ec] shadow-sm">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-[#e4e4ec] bg-[#f1f2f6] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#dcdce6]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#dcdce6]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#dcdce6]" />
        <div className="ml-2 h-5 w-40 rounded-md bg-white" />
      </div>

      {/* Fake page content — purely decorative skeleton so the widget
          doesn't float in an empty void. */}
      <div className="relative flex h-72 flex-col gap-3 bg-white p-6">
        <div className="h-3 w-2/5 rounded bg-[#eceef4]" />
        <div className="h-2.5 w-3/5 rounded bg-[#f1f2f6]" />
        <div className="h-2.5 w-1/3 rounded bg-[#f1f2f6]" />
        <div className="mt-4 h-20 w-full rounded-lg bg-[#f7f8fb]" />

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
            className="flex items-center gap-2 p-3"
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
            <p className="font-body text-xs font-semibold text-white">
              {businessName}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#f1f2f6] px-3 py-2 font-body text-xs text-[#14141c]">
              {welcomeMessage}
            </div>
            {suggestionChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestionChips.slice(0, 3).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border px-2.5 py-1 font-body text-[11px] font-medium text-[#14141c]"
                    style={{ borderColor: primaryColor }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
