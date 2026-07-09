import {
  SkeletonDetailHeader,
  SkeletonMiniStatGrid,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonDetailHeader />
      <SkeletonMiniStatGrid count={3} />
      <div className="mt-6">
        <SkeletonPanel className="h-24" />
      </div>
    </div>
  );
}
