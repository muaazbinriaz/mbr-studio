import { siteConfig } from "@/config/site";
import type { Service } from "@/types";

/**
 * JSON-LD schema builders — Blueprint Part 2, Section 13.
 *
 * Each function returns a plain object matching schema.org shape.
 * Render via the <JsonLd> component (components/seo/JsonLd.tsx),
 * which handles the <script type="application/ld+json"> wrapper.
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

export function caseStudySchema(
  project: {
    title: string;
    summary: string;
    slug: string;
    image: string;
    client: string;
    tags: string[];
  },
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    headline: project.title,
    name: project.title,
    description: project.summary,
    url,
    image: `${siteConfig.url}${project.image}`,
    about: project.client,
    keywords: project.tags.join(", "),
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

// Wired to app/(marketing)/blog/[slug]/page.tsx.
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
