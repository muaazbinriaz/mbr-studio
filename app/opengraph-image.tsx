import { siteConfig } from "@/config/site";
import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

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

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

export default async function Image() {
  return renderMarketingOgImage(siteConfig.name, siteConfig.tagline);
}
