import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import type { BlogPost } from "@/data/blog";
import { Badge } from "@/components/ui/badge";

export function BlogCard({ post }: { post: BlogPost }) {
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
        <div className="mt-4 text-primary">Read more</div>
      </div>
    </Link>
  );
}
