// app/(marketing)/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog";
import { formatDate } from "@/lib/formatters";
import { articleSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogCoverArt } from "@/components/sections/BlogCoverArt";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>; // ✅ params is async, per Next.js 15
}

function estimateReadingTime(html: string) {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
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
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug && p.published);

  // Covers both a genuinely nonexistent slug AND an unpublished post
  // (placeholder content) — neither should ever render.
  if (!post) notFound();

  const readingTime = estimateReadingTime(post.content);

  return (
    <>
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
      <article className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
        <div className="mb-8">
          <Link
            href="/blog"
            className="mb-4 inline-flex items-center gap-1.5 font-body text-sm text-secondary-text hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl border border-border md:h-80">
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
                  <Badge className="border-none bg-black/50 text-xs font-medium text-white backdrop-blur-sm">
                    {post.category}
                  </Badge>
                </div>
              </>
            ) : (
              <BlogCoverArt category={post.category} />
            )}
          </div>

          {!post.coverImage && (
            <Badge variant="outline" className="mb-3">
              {post.category}
            </Badge>
          )}

          <h1 className="font-heading text-h1-secondary font-bold leading-tight tracking-tight text-text">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-secondary-text">
            <span>{post.authorName}</span>
            <span>·</span>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {post.updatedAt && (
              <>
                <span>·</span>
                <time dateTime={post.updatedAt}>
                  Updated {formatDate(post.updatedAt)}
                </time>
              </>
            )}
            <span>·</span>
            <span>{readingTime} min read</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div
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
      </article>
    </>
  );
}
