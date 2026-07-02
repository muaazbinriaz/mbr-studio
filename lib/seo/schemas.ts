import { siteConfig } from "@/config/site";
import type { Service } from "@/types";

/**
 * JSON-LD schema builders — Blueprint Part 2, Section 13.
 *
 * Each function returns a plain object matching schema.org shape.
 * Render via the <JsonLd> component (components/seo/JsonLd.tsx),
 * which handles the <script type="application/ld+json"> wrapper.
 *
 * GAP: articleSchema() is written ahead of the blog existing, since
 * blog/page.tsx and blog/[slug]/page.tsx weren't part of the files I
 * was given. The shape below matches Blueprint Part 2 Section 13's
 * "Article schema on blog posts" requirement, but hasn't been wired
 * to a real page yet — do that once the blog post data shape exists,
 * rather than guessing its fields now.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/og-images/default.png`,
    founder: {
      "@type": "Person",
      name: siteConfig.founder,
    },
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: Object.values(siteConfig.links).filter(Boolean),
  };
}

export function serviceSchema(service: Service, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Not yet wired to a real page — see GAP note above.
export function articleSchema(post: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: post.authorName ?? siteConfig.founder,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/og-images/default.png`,
      },
    },
    image: post.image ? `${siteConfig.url}${post.image}` : undefined,
  };
}
