import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { estimateReadingTime } from "@/lib/blog";
import type { BlogPost } from "@/data/blog";
import { FadeIn } from "@/components/animations/FadeIn";
import { BlogCoverArt } from "@/components/sections/BlogCoverArt";
import { CategoryBadge } from "@/components/sections/blog/CategoryBadge";

/** Large editorial treatment for the single newest/highlighted article. */
export function FeaturedArticle({ post }: { post: BlogPost }) {
  const readingTime = estimateReadingTime(post.content);

  return (
    <FadeIn viewport={{ once: true, amount: 0.3 }}>
      <Link
        href={`/blog/${post.slug}`}
        className="group relative grid grid-cols-1 overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 md:grid-cols-2"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-auto">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 p-4">
              <BlogCoverArt category={post.category} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 md:bg-gradient-to-r" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Featured
            </span>
            <CategoryBadge category={post.category} />
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
          <div className="mb-4 flex items-center gap-2 text-xs text-secondary-text">
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {readingTime} min read
            </span>
          </div>
          <h2 className="mb-3 font-heading text-2xl font-bold leading-tight text-text transition-colors group-hover:text-primary md:text-3xl">
            {post.title}
          </h2>
          <p className="mb-6 text-base text-secondary-text md:text-lg">
            {post.summary}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">
              {post.authorName}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Read the full story
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}
