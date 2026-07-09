import { ImageResponse } from "next/og";

/**
 * Shared OG image renderer — same visual design as the original
 * app/opengraph-image.tsx (Blueprint Part 1, Section 3 colors), pulled
 * out so every marketing page can render its own distinct social
 * preview (eyebrow + headline) instead of all falling back to one
 * generic site-wide image.
 */
export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export function renderMarketingOgImage(eyebrow: string, headline: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        backgroundColor: "#030712",
        backgroundImage:
          "radial-gradient(circle at 15% 15%, rgba(99,102,241,0.25), transparent 55%), radial-gradient(circle at 85% 85%, rgba(6,182,212,0.2), transparent 55%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <path
              d="M8 22V10l8 7 8-7v12"
              stroke="#F9FAFB"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span style={{ color: "#94A3B8", fontSize: 24 }}>{eyebrow}</span>
      </div>

      <div
        style={{
          display: "flex",
          color: "#F9FAFB",
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.15,
          maxWidth: 900,
        }}
      >
        {headline}
      </div>
    </div>,
    { ...ogImageSize },
  );
}
