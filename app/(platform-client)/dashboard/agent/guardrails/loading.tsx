import {
  SkeletonPageHeader,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <SkeletonPanel className="h-96" />
        <SkeletonPanel className="h-96" />
      </div>
    </div>
  );
}
