import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "Privacy Policy — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage("Legal", "Privacy Policy");
}
