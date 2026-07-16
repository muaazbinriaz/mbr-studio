// app/(marketing)/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog";
import { BlogCard } from "@/components/sections/BlogCard";
import { FeaturedArticle } from "@/components/sections/blog/FeaturedArticle";
import { getCategoryStyle } from "@/lib/blog";

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

  // The single newest post gets the big editorial hero treatment; the
  // grid below shows everything else. Only on the unfiltered default
  // view — once someone filters, everything goes in the regular grid so
  // filtered results don't feel arbitrarily reordered.
  const isDefaultView = !category && !tag;
  const sortedByDate = [...filtered].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const featuredPost = isDefaultView ? sortedByDate[0] : undefined;
  const restPosts = isDefaultView ? sortedByDate.slice(1) : filtered;

  return (
    <>
      {/* ---------------------------------------------------------------
          Hero
      --------------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent/15 blur-[110px]"
        />
        <div className="relative mx-auto max-w-6xl page-hero-pad">
          <p className="mb-3 inline-flex items-center gap-2 font-body text-sm font-medium tracking-wide text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            The MBR Studio Blog
          </p>
          <h1 className="max-w-3xl font-heading text-h1-primary font-bold leading-[1.05] tracking-tight text-text">
            Practical insight for building{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              a business online.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl font-body text-lg text-secondary-text">
            Straight-talking advice on websites, AI automation, and growth —
            written from real client work, not recycled listicles.
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
              <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-5">
                <div className="w-full space-y-2.5 sm:w-auto">
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary-text">
                    Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/blog"
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                        !category
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border text-secondary-text hover:border-primary/40 hover:text-text"
                      }`}
                    >
                      All
                    </Link>
                    {allCategories.map((cat) => {
                      const style = getCategoryStyle(cat);
                      const active = category === cat;
                      return (
                        <Link
                          key={cat}
                          href={`/blog?category=${encodeURIComponent(cat)}`}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-all duration-200 ${
                            active
                              ? `${style.bg} ${style.text} ${style.ring}`
                              : "border border-border text-secondary-text ring-transparent hover:border-primary/40 hover:text-text"
                          }`}
                        >
                          {cat}
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="w-full space-y-2.5 sm:w-auto">
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary-text">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((t) => (
                      <Link
                        key={t}
                        href={`/blog?tag=${encodeURIComponent(t)}`}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                          tag === t
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "border border-border text-secondary-text hover:border-accent/40 hover:text-text"
                        }`}
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {publishedPosts.length > 0 && (
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
            {/* Featured — the newest post gets a large, editorial-style
                treatment instead of blending into the grid. */}
            {featuredPost && (
              <div className="mb-14">
                <FeaturedArticle post={featuredPost} />
              </div>
            )}

            {/* Rest of the grid */}
            {restPosts.length > 0 && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {restPosts.map((post, i) => (
                  <BlogCard key={post.slug} post={post} index={i} />
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <p className="col-span-full py-16 text-center text-secondary-text">
                No posts found for this filter.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
