import {
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <SkeletonStatGrid
        count={3}
        gridClassName="grid-cols-1 gap-4 sm:grid-cols-3"
      />
      <div className="mt-6">
        <SkeletonPanel className="h-56" />
      </div>
    </div>
  );
}
