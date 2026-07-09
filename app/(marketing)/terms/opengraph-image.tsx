import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "Terms of Service — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage("Legal", "Terms of Service");
}
