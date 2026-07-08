import {
  SkeletonPageHeader,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <SkeletonPanel className="h-80" />
        <SkeletonPanel className="h-80" />
      </div>
    </div>
  );
}
