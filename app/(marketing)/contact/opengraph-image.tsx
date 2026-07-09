import {
  renderMarketingOgImage,
  ogImageSize,
  ogImageContentType,
} from "@/lib/seo/og-image";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "Contact — MBR Studio";

export default async function Image() {
  return renderMarketingOgImage("Contact", "Let's talk about your project.");
}
