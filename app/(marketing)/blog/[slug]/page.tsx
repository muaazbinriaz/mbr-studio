// app/(marketing)/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blog";
import { formatDate } from "@/lib/formatters";
import { articleSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";

interface BlogPostPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

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
          // image: post.image,
        })}
      />
      <main id="main-content">
        <article className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-8">
            <Badge variant="outline" className="mb-3">
              {post.category}
            </Badge>
            <h1 className="font-heading text-[32px] font-bold leading-tight text-text sm:text-[44px]">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-2 text-sm text-secondary-text">
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
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </>
  );
}
