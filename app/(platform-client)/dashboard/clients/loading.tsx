import {
  SkeletonPageHeader,
  SkeletonBlock,
  SkeletonList,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <SkeletonBlock className="h-4 w-32" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <SkeletonBlock className="h-10 flex-1" />
            <SkeletonBlock className="h-10 w-32" />
          </div>
        </div>
      </div>
      <div className="mt-8">
        <SkeletonList rows={4} />
      </div>
    </div>
  );
}
