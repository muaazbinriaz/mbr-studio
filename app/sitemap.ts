import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { projects } from "@/data/projects";
import { blogPosts } from "@/data/blog";

const STATIC_ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/services", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/ai-agent", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/portfolio", changeFrequency: "weekly" as const, priority: 0.8 },
  {
    path: "/case-studies",
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const caseStudyEntries: MetadataRoute.Sitemap = (
    projects as { slug: string }[]
  ).map((project) => ({
    url: `${siteConfig.url}/case-studies/${project.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts
    .filter((post) => post.published)
    .map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.updatedAt
        ? new Date(post.updatedAt)
        : new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticEntries, ...caseStudyEntries, ...blogEntries];
}
