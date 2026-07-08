import {
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

// Next.js convention: Suspense fallback for dashboard/page.tsx
// specifically — every nested route (leads, inbox, channels, etc.)
// already has its own more specific loading.tsx, which Next.js
// prefers over this one. Shape matches the real Overview page.
export default function DashboardLoading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-md" />
      <SkeletonStatGrid count={4} />
      <div className="mt-6 flex flex-col gap-4">
        <SkeletonPanel className="h-64" />
        <SkeletonPanel className="h-32" />
      </div>
    </div>
  );
}
