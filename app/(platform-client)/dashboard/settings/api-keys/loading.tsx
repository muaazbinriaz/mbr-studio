import {
  SkeletonPageHeader,
  SkeletonList,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8">
        <SkeletonList rows={3} />
      </div>
    </div>
  );
}
