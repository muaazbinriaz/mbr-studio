import {
  SkeletonPageHeader,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8 flex flex-col gap-6">
        <SkeletonPanel className="h-40" />
        <SkeletonPanel className="h-40" />
        <SkeletonPanel className="h-40" />
      </div>
    </div>
  );
}
