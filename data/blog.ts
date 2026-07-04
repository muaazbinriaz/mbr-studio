// data/blog.ts
/**
 * CONTENT-COMPLETENESS NOTE (for whoever edits this file next, including
 * a future AI session):
 *
 * Every post below currently has PLACEHOLDER `content` (literal developer
 * notes like "Full markdown/content here...", not real article text) and
 * is therefore marked `published: false`. The blog index and post-detail
 * pages both filter on `published`, so unpublished posts are invisible to
 * visitors and excluded from the sitemap and static params — this is
 * intentional and is what keeps placeholder text from ever being shown as
 * if it were a real article.
 *
 * Set `published: true` ONLY once `content` contains real, final article
 * HTML for that post. Do not flip this to true with placeholder content
 * still in place — that would reintroduce the exact bug this mechanism
 * exists to prevent.
 */
export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  authorName: string;
  coverImage?: string;
  category: string;
  tags: string[];
  content: string;
  /** Only true once `content` holds real, final article copy — see note above. */
  published: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-much-does-a-website-cost",
    title: "How much does a website actually cost in 2026?",
    summary:
      "Breakdown of typical website costs for small businesses, from landing pages to custom SaaS builds.",
    publishedAt: "2026-06-15T08:00:00Z",
    updatedAt: "2026-06-20T10:00:00Z",
    authorName: "Muaaz Bin Riaz",
    category: "Pricing & ROI",
    tags: ["website cost", "pricing", "small business"],
    content: `Full markdown/content here... (use a simple HTML string or MDX; we'll use HTML for simplicity)`,
    published: false,
  },
  {
    slug: "do-i-need-a-chatbot-for-my-business",
    title: "Do I really need an AI chatbot for my business?",
    summary:
      "When a chatbot makes sense, and when it doesn't — a practical guide for business owners.",
    publishedAt: "2026-06-20T08:00:00Z",
    authorName: "Muaaz Bin Riaz",
    category: "Automation",
    tags: ["ai chatbot", "customer support", "automation"],
    content: `...`,
    published: false,
  },
  {
    slug: "website-vs-facebook-page",
    title: "Website vs Facebook page: what's better for your business?",
    summary:
      "Why a dedicated website still matters more than a social media page for credibility and conversions.",
    publishedAt: "2026-06-25T08:00:00Z",
    authorName: "Muaaz Bin Riaz",
    category: "Digital Presence",
    tags: ["website", "facebook", "online presence"],
    content: `...`,
    published: false,
  },
];
