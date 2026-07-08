import {
  SkeletonDetailHeader,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonDetailHeader />
      <div className="mt-8">
        <SkeletonPanel className="h-40" />
      </div>
    </div>
  );
}
