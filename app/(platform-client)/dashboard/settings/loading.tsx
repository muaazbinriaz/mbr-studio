import {
  SkeletonPageHeader,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8">
        <SkeletonPanel className="h-56" />
      </div>
    </div>
  );
}
