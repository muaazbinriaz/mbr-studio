import {
  SkeletonBlock,
  SkeletonImageCardGrid,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <>
      <section className="bg-background">
        <div className="mx-auto max-w-6xl page-hero-pad">
          <div className="mb-14 max-w-2xl">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-10 w-full" />
          </div>

          {/* Filter tabs — matches PortfolioGrid's centered tab row */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            <SkeletonBlock className="h-9 w-16 rounded-full" />
            <SkeletonBlock className="h-9 w-20 rounded-full" />
            <SkeletonBlock className="h-9 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-16 rounded-full" />
          </div>

          <SkeletonImageCardGrid
            count={6}
            gridClassName="grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          />
        </div>
      </section>

      {/* Closing CTA — matches the bottom section in the real page */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <SkeletonBlock className="mx-auto h-8 w-2/3" />
          <SkeletonBlock className="mx-auto mt-4 h-4 w-full max-w-xl" />
          <SkeletonBlock className="mx-auto mt-2 h-4 w-2/3 max-w-md" />
          <SkeletonBlock className="mx-auto mt-8 h-12 w-52 rounded-lg" />
        </div>
      </section>
    </>
  );
}
