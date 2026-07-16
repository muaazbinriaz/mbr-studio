"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { estimateReadingTime } from "@/lib/blog";
import type { BlogPost } from "@/data/blog";
import { FadeIn } from "@/components/animations/FadeIn";
import { BlogCoverArt } from "@/components/sections/BlogCoverArt";
import { CategoryBadge } from "@/components/sections/blog/CategoryBadge";

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
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.06 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -6, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />
      <Link
        href={`/blog/${post.slug}`}
        className="relative flex h-full flex-col focus-visible:outline-none"
      >
        <div
          className={`relative w-full shrink-0 overflow-hidden ${
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
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              priority={featured}
            />
          ) : (
            <div className="absolute inset-0 p-3">
              <BlogCoverArt category={post.category} compact />
            </div>
          )}
          {/* Gradient scrim so the category badge is always legible over any photo */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-black/0" />
          <div className="absolute left-3 top-3">
            <CategoryBadge category={post.category} />
          </div>
        </div>

        <div className={`flex flex-1 flex-col ${featured ? "p-7" : "p-6"}`}>
          <div className="mb-3 flex items-center gap-2 text-xs text-secondary-text">
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {readingTime} min read
            </span>
          </div>
          <h2
            className={`mb-2 font-heading font-semibold leading-snug text-text transition-colors group-hover:text-primary ${
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
          <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
            <span className="text-xs text-secondary-text">
              {post.authorName}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Read article
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}
