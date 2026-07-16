import type { BlogPost } from "@/data/blog";
import { BlogCard } from "@/components/sections/BlogCard";

export function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-articles-heading">
      <h2
        id="related-articles-heading"
        className="mb-6 font-heading text-xl font-bold text-text md:text-2xl"
      >
        Related articles
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <BlogCard key={post.slug} post={post} index={i} />
        ))}
      </div>
    </section>
  );
}
