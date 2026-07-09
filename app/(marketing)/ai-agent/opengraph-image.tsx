import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "AI Agent — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage(
    "AI Agent Platform",
    "Give your business a 24/7 AI agent — try the exact one your customers would talk to.",
  );
}
