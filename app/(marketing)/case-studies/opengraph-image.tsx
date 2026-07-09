import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "Case Studies — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage(
    "Case Studies",
    "The problem, the approach, and the outcome — for real projects.",
  );
}
