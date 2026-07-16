// app/(marketing)/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog";
import { formatDate } from "@/lib/formatters";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import {
  estimateReadingTime,
  getRelatedPosts,
  getAdjacentPosts,
} from "@/lib/blog";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { BlogCoverArt } from "@/components/sections/BlogCoverArt";
import { CategoryBadge } from "@/components/sections/blog/CategoryBadge";
import { ReadingProgressBar } from "@/components/sections/blog/ReadingProgressBar";
import { ShareButtons } from "@/components/sections/blog/ShareButtons";
import { AuthorCard } from "@/components/sections/blog/AuthorCard";
import { RelatedArticles } from "@/components/sections/blog/RelatedArticles";
import { PostNavigation } from "@/components/sections/blog/PostNavigation";
import { BlogCTA } from "@/components/sections/blog/BlogCTA";
import { NewsletterSignup } from "@/components/sections/blog/NewsletterSignup";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>; // ✅ params is async, per Next.js 15
}

export function generateStaticParams() {
  // Only prerender published posts — unpublished posts (placeholder
  // content) shouldn't be accessible as static routes at all.
  return blogPosts
    .filter((post) => post.published)
    .map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug && p.published);
  if (!post) return {};
  const url = `${siteConfig.url}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.authorName],
      tags: post.tags,
      ...(post.coverImage && {
        images: [{ url: post.coverImage, alt: post.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      ...(post.coverImage && { images: [post.coverImage] }),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug && p.published);

  // Covers both a genuinely nonexistent slug AND an unpublished post
  // (placeholder content) — neither should ever render.
  if (!post) notFound();

  const readingTime = estimateReadingTime(post.content);
  const url = `${siteConfig.url}/blog/${post.slug}`;
  const relatedPosts = getRelatedPosts(post, blogPosts);
  const { prev, next } = getAdjacentPosts(post, blogPosts);

  return (
    <>
      <ReadingProgressBar targetId="article-content" />
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.summary,
          slug: post.slug,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          authorName: post.authorName,
          image: post.coverImage,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: `${siteConfig.url}/blog` },
          { name: post.title, url },
        ])}
      />

      <article className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-secondary-text">
            <li>
              <Link href="/" className="hover:text-text">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-text">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li
              className="max-w-[220px] truncate text-secondary-text"
              aria-current="page"
            >
              {post.title}
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <Link
            href="/blog"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 font-body text-sm text-secondary-text transition-all duration-200 hover:-translate-x-0.5 hover:border-primary/40 hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to blog
          </Link>

          <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl border border-border md:h-96">
            {post.coverImage ? (
              <>
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
                <div className="absolute bottom-4 left-4">
                  <CategoryBadge category={post.category} />
                </div>
              </>
            ) : (
              <BlogCoverArt category={post.category} />
            )}
          </div>

          {!post.coverImage && (
            <div className="mb-3">
              <CategoryBadge category={post.category} variant="soft" />
            </div>
          )}

          <h1 className="font-heading text-h1-secondary font-bold leading-tight tracking-tight text-text">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-secondary-text">
            <span className="font-medium text-text">{post.authorName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {post.updatedAt && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={post.updatedAt}>
                  Updated {formatDate(post.updatedAt)}
                </time>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {readingTime} min read
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-secondary-text transition-colors hover:border-primary/40 hover:text-text"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sticky share rail — desktop only, mobile gets an inline row below the header instead */}
          <div className="hidden shrink-0 md:block">
            <div className="sticky top-28">
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-6 md:hidden">
              <ShareButtons url={url} title={post.title} />
            </div>

            <div
              id="article-content"
              className="article-body max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Extra in-article photos — only renders when a post actually
                has more than one relevant image to show. */}
            {post.galleryImages && post.galleryImages.length > 0 && (
              <div
                className={`mt-12 grid grid-cols-1 gap-4 ${
                  post.galleryImages.length > 1 ? "sm:grid-cols-2" : ""
                }`}
              >
                {post.galleryImages.map((img) => (
                  <div
                    key={img}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={img}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 384px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12">
              <AuthorCard name={post.authorName} />
            </div>

            <div className="mt-12">
              <BlogCTA />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <PostNavigation prev={prev} next={next} />
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-background-secondary/40">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
            <RelatedArticles posts={relatedPosts} />
          </div>
        </section>
      )}

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}
