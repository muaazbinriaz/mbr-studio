import {
  SkeletonHero,
  SkeletonFeaturedCard,
  SkeletonBlogCard,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
      <SkeletonHero align="left" maxWidth="max-w-3xl" />
      <div className="mt-14">
        <SkeletonFeaturedCard />
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlogCard key={i} />
        ))}
      </div>
    </div>
  );
}
