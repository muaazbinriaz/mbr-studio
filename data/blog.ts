// data/blog.ts
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
  },
];
