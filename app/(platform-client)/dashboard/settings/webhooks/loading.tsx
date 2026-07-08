import {
  SkeletonPageHeader,
  SkeletonPanel,
  SkeletonList,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8">
        <SkeletonPanel className="h-40" />
      </div>
      <div className="mt-6">
        <SkeletonList rows={3} />
      </div>
    </div>
  );
}
