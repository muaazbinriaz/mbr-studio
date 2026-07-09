import {
  SkeletonPageHeader,
  SkeletonPanel,
  SkeletonList,
} from "@/components/platform/Skeleton";

// ApiKeysClient always renders the "generate key" form row above the
// list — that panel was missing from this skeleton entirely.
export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8">
        <SkeletonPanel className="h-16" />
      </div>
      <div className="mt-6">
        <SkeletonList rows={3} />
      </div>
    </div>
  );
}
