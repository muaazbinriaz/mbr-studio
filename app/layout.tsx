import { Suspense } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
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

/**
 * Blocking theme-init script — prevents flash-of-wrong-theme (FOUC).
 *
 * ThemeProvider.tsx's own theme detection runs inside a useEffect, which
 * only fires AFTER the first paint — so a light-mode visitor would
 * briefly see the dark theme applied before it self-corrects. This
 * script runs via next/script's `beforeInteractive` strategy, which
 * Next.js injects into <head> and guarantees executes before hydration,
 * so the correct .dark class is already on <html> at first paint.
 *
 * Logic intentionally mirrors ThemeProvider.tsx exactly (same storage
 * key "mbr-theme", same matchMedia fallback) so that when
 * ThemeProvider's useEffect runs after hydration, it reads the same
 * source and arrives at the same result — no second visible flip.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('mbr-theme');
    var initial = stored ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', initial === 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${inter.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
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

        {/*
          Analytics — makes privacy/page.tsx's claim ("Vercel Analytics
          and Google Analytics") actually true.

          <Analytics /> (Vercel) doesn't need Suspense/provider wrapping —
          it's a self-contained client component that injects a script
          and reports Web Vitals / page views on route change internally.
          Rendered as a top-level sibling in <body>, same as the docs'
          recommended placement.

          NOTE — cookie consent: this site's Privacy Policy references
          GDPR/UK compliance, which implies EU/UK visitors may need a
          consent mechanism before analytics scripts fire. That's a
          legal/product decision, not something to silently bolt on here
          — intentionally NOT implemented in this change. Before this
          goes live for EU/UK traffic, add a consent-gating layer (e.g.
          only rendering <Analytics />/<GoogleAnalytics /> after consent,
          or using a CMP) around this block.
        */}
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
