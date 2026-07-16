// lib/blog.ts
/**
 * Shared blog utilities — kept in one place so BlogCard, the blog index,
 * and the post-detail page can never drift into computing reading time
 * or category colors differently from one another.
 */
import type { BlogPost } from "@/data/blog";

/** Rough reading time estimate from an HTML content string. */
export function estimateReadingTime(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Per-category color language — soft tinted background + matching text,
 * built from the existing design tokens (not new hardcoded hexes) so
 * badges stay correct in both light and dark mode. Falls back to a
 * neutral treatment for any category not listed here.
 */
export const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; ring: string; dot: string }
> = {
  "Pricing & ROI": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
  Automation: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
  },
  "AI Agents": {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
    dot: "bg-violet-500",
  },
  "Buying Guide": {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/20",
    dot: "bg-cyan-500",
  },
  "Digital Presence": {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
    dot: "bg-rose-500",
  },
  "Website Development": {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
    dot: "bg-blue-500",
  },
  "SaaS Development": {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/20",
    dot: "bg-indigo-500",
  },
  "Founder Notes": {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/20",
    dot: "bg-orange-500",
  },
};

export const DEFAULT_CATEGORY_STYLE = {
  bg: "bg-primary/10",
  text: "text-primary",
  ring: "ring-primary/20",
  dot: "bg-primary",
};

export function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE;
}

/**
 * Related-posts scoring: same category outranks shared tags, shared tags
 * outrank recency-only. Excludes the current post, always published-only.
 */
export function getRelatedPosts(
  current: BlogPost,
  allPosts: BlogPost[],
  limit = 3,
): BlogPost[] {
  const candidates = allPosts.filter(
    (p) => p.published && p.slug !== current.slug,
  );

  const scored = candidates.map((post) => {
    let score = 0;
    if (post.category === current.category) score += 3;
    score += post.tags.filter((t) => current.tags.includes(t)).length;
    return { post, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (
      new Date(b.post.publishedAt).getTime() -
      new Date(a.post.publishedAt).getTime()
    );
  });

  return scored.slice(0, limit).map((s) => s.post);
}

export function getAdjacentPosts(
  current: BlogPost,
  allPosts: BlogPost[],
): { prev: BlogPost | null; next: BlogPost | null } {
  const published = allPosts
    .filter((p) => p.published)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
    );

  const index = published.findIndex((p) => p.slug === current.slug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  };
}
