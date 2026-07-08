import {
  SkeletonPageHeader,
  SkeletonSplitPane,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-4">
        <SkeletonPageHeader descriptionWidth="w-72" />
      </div>
      <SkeletonSplitPane />
    </div>
  );
}
