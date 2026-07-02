import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/**
 * Default OG image — Blueprint Part 2, Section 13.
 * Next.js's file-convention API: any route segment can override this
 * by adding its own opengraph-image.tsx (e.g.
 * app/(marketing)/services/opengraph-image.tsx) with the same export
 * shape. This root one is the fallback for every page that doesn't.
 *
 * Colors match the design system in Blueprint Part 1, Section 3 —
 * kept as literal hex here since ImageResponse renders outside the
 * Tailwind/CSS-variable pipeline and can't read globals.css.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

export default async function Image() {
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
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "#111827",
            color: "#F9FAFB",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          MBR
        </div>
        <span style={{ color: "#94A3B8", fontSize: 24 }}>
          {siteConfig.name}
        </span>
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
        {siteConfig.tagline}
      </div>
    </div>,
    { ...size },
  );
}
