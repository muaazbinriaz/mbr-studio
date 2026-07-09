import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "Services — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage(
    "Services",
    "Everything you need to build, automate, and grow.",
  );
}
