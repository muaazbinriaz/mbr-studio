import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "Portfolio — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage(
    "Portfolio",
    "Work built for real businesses, not a mockup gallery.",
  );
}
