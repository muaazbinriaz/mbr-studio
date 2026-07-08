import {
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-72" />
      <SkeletonStatGrid
        count={5}
        gridClassName="grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      />
      <div className="mt-8">
        <SkeletonPanel className="h-56" />
      </div>
    </div>
  );
}
