import { Suspense } from "react";
import { ChatProvider } from "@/components/chatbot/useChat";
import { ChatWindow } from "@/components/chatbot/ChatWindow";
import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema } from "@/lib/seo/schemas";
import { SkipLink } from "@/components/a11y/SkipLink";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { RouteLoaderProvider } from "@/components/loader/RouteLoader";

// Headings — Blueprint Part 1, Section 3
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body copy — Blueprint Part 1, Section 3
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * SEO PASS (Prompt 20) — fixed a title-duplication bug here:
 *
 * The template was "%s | MBR Studio", but every page's own metadata
 * (services/page.tsx, about/page.tsx, etc.) already hardcoded titles
 * like "Services | MBR Studio". Combined, the rendered tab title was
 * "Services | MBR Studio | MBR Studio". Fixed by:
 *   1. Changing the template here to match Blueprint Part 2 Section 13's
 *      exact pattern: "[Page Topic] | MBR Studio — Websites & AI Automation".
 *   2. Trimming each page's title down to just the topic (see the
 *      updated services/about/portfolio/contact page files).
 *
 * metadataBase is required for Next.js to resolve relative
 * `alternates.canonical` and OG image URLs into absolute ones — it
 * was missing before, which would have made canonical tags in
 * per-page metadata silently resolve incorrectly.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name} — Websites & AI Automation`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${inter.variable} antialiased`}>
        <ThemeProvider>
          <Suspense fallback={null}>
            <RouteLoaderProvider>
              <SkipLink />
              <JsonLd data={organizationSchema()} />
              <ChatProvider>
                {children}
                <ChatWindow />
              </ChatProvider>
            </RouteLoaderProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
