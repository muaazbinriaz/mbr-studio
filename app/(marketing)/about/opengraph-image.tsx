import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "About — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage(
    "About",
    "A studio built around one engineer's standards, not a growing headcount.",
  );
}
