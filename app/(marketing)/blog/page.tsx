// app/(marketing)/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog";
import { BlogCard } from "@/components/sections/BlogCard";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on websites, AI automation, and digital growth for small businesses.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;

  // Only ever consider published posts — unpublished ones currently hold
  // literal placeholder content and must never reach a visitor.
  const publishedPosts = blogPosts.filter((post) => post.published);

  // Derived from published posts only, so a filter chip never points at
  // a category/tag that would immediately show zero results.
  const allCategories = Array.from(
    new Set(publishedPosts.map((p) => p.category)),
  );
  const allTags = Array.from(new Set(publishedPosts.flatMap((p) => p.tags)));

  let filtered = publishedPosts;
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

          {publishedPosts.length === 0 ? (
            <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-border bg-card px-8 py-16 text-center">
              <p className="font-heading text-lg font-medium text-text">
                New articles are on their way.
              </p>
              <p className="mt-2 font-body text-sm text-secondary-text">
                We&apos;re preparing in-depth write-ups on websites, automation,
                and growth — check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="mt-10 flex flex-wrap gap-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-text">
                    Categories
                  </span>
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}
