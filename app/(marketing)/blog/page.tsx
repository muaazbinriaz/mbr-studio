// app/(marketing)/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import { blogPosts, type BlogPost } from "@/data/blog";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on websites, AI automation, and digital growth for small businesses.",
};

// Extract unique categories and tags for filtering
const allCategories = Array.from(new Set(blogPosts.map((p) => p.category)));
const allTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags)));

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { category?: string; tag?: string };
}) {
  const { category, tag } = searchParams ?? {};

  let filtered = blogPosts;
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (tag) {
    filtered = filtered.filter((p) => p.tags.includes(tag));
  }

  return (
    <main id="main-content">
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <p className="mb-3 font-body text-sm font-medium tracking-wide text-accent">
            Blog
          </p>
          <h1 className="font-heading text-[36px] font-bold leading-tight tracking-tight text-text sm:text-[48px]">
            Articles & Insights
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base text-secondary-text">
            Practical advice on websites, automation, and growing your business
            online.
          </p>

          {/* Filters */}
          <div className="mt-10 flex flex-wrap gap-6">
            <div className="space-y-2">
              <span className="text-sm font-medium text-text">Categories</span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/blog"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    !category
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-secondary-text hover:text-text"
                  }`}
                >
                  All
                </Link>
                {allCategories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/blog?category=${encodeURIComponent(cat)}`}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      category === cat
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-secondary-text hover:text-text"
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-text">Tags</span>
              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => (
                  <Link
                    key={t}
                    href={`/blog?tag=${encodeURIComponent(t)}`}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      tag === t
                        ? "bg-accent text-accent-foreground"
                        : "border border-border text-secondary-text hover:text-text"
                    }`}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Blog grid */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-16 text-center text-secondary-text">
                No posts found for this filter.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-secondary-text">
          <Badge variant="outline" className="text-xs">
            {post.category}
          </Badge>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h2 className="mb-2 font-heading text-lg font-semibold text-text group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-secondary-text">{post.summary}</p>
        <p className="mt-4 font-medium text-primary">Read more</p>
      </div>
    </Link>
  );
}
