import { SkeletonBlock } from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <>
      {/* Hero — two-column split, matches Hero.tsx (min-h-[88vh]) */}
      <section className="relative overflow-hidden bg-background">
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center gap-12 px-6 py-32 md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-4xl flex-col lg:flex-1">
            <SkeletonBlock className="h-8 w-72 rounded-full" />
            <SkeletonBlock className="mt-6 h-10 w-full max-w-2xl" />
            <SkeletonBlock className="mt-2 h-10 w-2/3" />
            <SkeletonBlock className="mt-6 h-5 w-full max-w-xl" />
            <SkeletonBlock className="mt-2 h-5 w-1/2" />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <SkeletonBlock className="h-12 w-52 rounded-lg" />
              <SkeletonBlock className="h-12 w-40 rounded-lg" />
            </div>
          </div>
          <SkeletonBlock className="hidden aspect-square w-full max-w-sm rounded-2xl lg:block" />
        </div>
      </section>

      {/* MarqueeStrip — thin full-bleed bar, no container/cards */}
      <div className="w-full bg-card/60 py-3.5">
        <SkeletonBlock className="mx-auto h-4 w-3/4 max-w-2xl" />
      </div>

      {/* ProblemStatement — left-aligned, single big statement */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="max-w-3xl">
            <SkeletonBlock className="mb-8 h-[2px] w-16" />
            <SkeletonBlock className="h-8 w-full" />
            <SkeletonBlock className="mt-3 h-8 w-full" />
            <SkeletonBlock className="mt-3 h-8 w-2/3" />
          </div>
        </div>
      </section>

      {/* Services — header + 6 cards, grid-cols-1 md:2 lg:3 */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-9 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <SkeletonBlock className="h-10 w-10 rounded-xl" />
                <SkeletonBlock className="mt-4 h-4 w-2/3" />
                <SkeletonBlock className="mt-2 h-3 w-full" />
                <SkeletonBlock className="mt-1 h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FeaturedProjects — header + link + 3 cards */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-3 h-9 w-full" />
            </div>
            <SkeletonBlock className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <SkeletonBlock className="aspect-[4/3] w-full rounded-none" />
                <div className="p-5">
                  <SkeletonBlock className="h-4 w-3/4" />
                  <SkeletonBlock className="mt-2 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process — numbered vertical timeline, 6 steps */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-14 max-w-2xl">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-9 w-full" />
          </div>
          <div className="flex flex-col gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-5">
                <SkeletonBlock className="h-10 w-10 flex-none rounded-full" />
                <div className="flex-1">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="mt-2 h-3 w-full max-w-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhyChooseUs — sticky-left heading + stacked list right */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-20">
            <div>
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="mt-3 h-9 w-full" />
            </div>
            <div className="flex flex-col gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <SkeletonBlock className="h-10 w-10 flex-none rounded-xl" />
                  <div className="flex-1">
                    <SkeletonBlock className="h-4 w-1/2" />
                    <SkeletonBlock className="mt-2 h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technologies — centered label + wrapped pill row */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <SkeletonBlock className="mx-auto h-4 w-64" />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-5 w-24" />
            ))}
          </div>
        </div>
      </section>

      {/* StatsBar — testimonials.ts is currently empty, so this renders
          instead of the Testimonials carousel. Update this to a
          testimonial-card skeleton once real testimonials are added. */}
      <section className="border-t border-border bg-secondary-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <SkeletonBlock className="mx-auto h-9 w-16" />
                <SkeletonBlock className="mx-auto mt-2 h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — centered header + divided rows */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-32">
          <div className="mb-12 text-center">
            <SkeletonBlock className="mx-auto h-4 w-16" />
            <SkeletonBlock className="mx-auto mt-3 h-9 w-64" />
          </div>
          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-6"
              >
                <SkeletonBlock className="h-5 w-3/4" />
                <SkeletonBlock className="h-5 w-5 flex-none rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
