import {
  SkeletonPageHeader,
  SkeletonPanel,
  SkeletonList,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-6">
        <SkeletonPanel className="h-24" />
      </div>
      <div className="mt-8">
        <SkeletonList rows={4} />
      </div>
    </div>
  );
}
