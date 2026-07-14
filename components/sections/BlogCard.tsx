"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { BlogPost } from "@/data/blog";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/animations/FadeIn";
import { BlogCoverArt } from "@/components/sections/BlogCoverArt";

// Rough reading time estimate from the HTML content string — good enough
// for a "X min read" label without adding a markdown/word-count dependency.
function estimateReadingTime(html: string) {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogCard({
  post,
  index = 0,
  featured = false,
}: {
  post: BlogPost;
  index?: number;
  /** Larger, editorial-style treatment — used for the top posts on the blog index. */
  featured?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const readingTime = estimateReadingTime(post.content);

  return (
    <FadeIn
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.06 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${
        featured ? "md:col-span-1" : ""
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />
      <Link href={`/blog/${post.slug}`} className="relative block">
        <div
          className={`relative w-full overflow-hidden ${
            featured ? "aspect-[16/10]" : "aspect-[16/10]"
          }`}
        >
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 50vw"
                  : "(max-width: 768px) 100vw, 400px"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={featured}
            />
          ) : (
            <div className="absolute inset-0 p-3">
              <BlogCoverArt category={post.category} compact />
            </div>
          )}
          {/* Gradient scrim so the category badge is always legible over any photo */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
          <div className="absolute left-3 top-3">
            <Badge className="border-none bg-black/50 text-xs font-medium text-white backdrop-blur-sm">
              {post.category}
            </Badge>
          </div>
        </div>

        <div className={featured ? "p-7" : "p-6"}>
          <div className="mb-3 flex items-center gap-2 text-xs text-secondary-text">
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <span>·</span>
            <span>{readingTime} min read</span>
          </div>
          <h2
            className={`mb-2 font-heading font-semibold text-text transition-colors group-hover:text-primary ${
              featured ? "text-xl md:text-2xl" : "text-lg"
            }`}
          >
            {post.title}
          </h2>
          <p
            className={`text-secondary-text ${
              featured
                ? "text-sm md:text-base line-clamp-2"
                : "text-sm line-clamp-2"
            }`}
          >
            {post.summary}
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Read more
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}
