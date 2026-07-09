import {
  SkeletonDetailHeader,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

// OrgDetailClient's guaranteed-present content is just the "Reseller
// status" card (~h-32); the branding form + sub-clients panels only
// render when org.is_reseller is true, which loading.tsx can't know
// ahead of the fetch. Matching the smaller guaranteed case, since
// overshooting height for non-reseller orgs is worse than a brief
// pop-in of extra panels for reseller orgs.
export default function Loading() {
  return (
    <div>
      <SkeletonDetailHeader />
      <div className="mt-8">
        <SkeletonPanel className="h-32" />
      </div>
    </div>
  );
}
