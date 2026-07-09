import {
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonPanel,
  SkeletonButtonRow,
} from "@/components/platform/Skeleton";

// Shape matches the real Overview page for the common case (no
// trial/limit banner, checklist dismissed): header -> stat grid ->
// analytics chart -> CTA button row. PlanLimitBanner and
// GettingStartedChecklist self-hide when not applicable (see those
// components), so they're intentionally not skeleton'd here to avoid
// overshooting height for the majority of returning users.
export default function DashboardLoading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-md" />
      <SkeletonStatGrid count={4} />
      <div className="mt-8">
        <SkeletonPanel className="h-64" />
      </div>
      <div className="mt-8">
        <SkeletonButtonRow count={2} />
      </div>
    </div>
  );
}
