"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { formatDate } from "@/lib/formatters";
import type { BlogPost } from "@/data/blog";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/animations/FadeIn";

export function BlogCard({
  post,
  index = 0,
}: {
  post: BlogPost;
  index?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <FadeIn
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.06 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-200 hover:border-primary/50"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover-glow-primary transition-opacity duration-300 group-hover:opacity-100"
      />
      <Link href={`/blog/${post.slug}`} className="relative block p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-secondary-text">
          <Badge variant="outline" className="text-xs">
            {post.category}
          </Badge>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h2 className="mb-2 font-heading text-lg font-semibold text-text transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="text-sm text-secondary-text">{post.summary}</p>
        <div className="mt-4 text-primary">Read more</div>
      </Link>
    </FadeIn>
  );
}
