import {
  SkeletonPageHeader,
  SkeletonSplitPane,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-4">
        <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      </div>
      <SkeletonSplitPane />
    </div>
  );
}
