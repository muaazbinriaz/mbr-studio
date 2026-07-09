// app/(marketing)/loading.tsx
import { SkeletonBlock, SkeletonPanel } from "@/components/platform/Skeleton";

// In-flow skeleton (not a full-screen overlay) so it renders inside
// (marketing)/layout.tsx's <main> exactly like every real marketing page
// does — Navbar and Footer stay visible and unblocked during navigation,
// matching the same pattern already used by every dashboard/admin
// loading.tsx (see components/platform/Skeleton.tsx).
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <SkeletonBlock className="mx-auto h-4 w-32" />
        <SkeletonBlock className="mx-auto mt-5 h-10 w-full max-w-md" />
        <SkeletonBlock className="mx-auto mt-3 h-4 w-full max-w-sm" />
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonPanel className="h-48" />
        <SkeletonPanel className="h-48" />
        <SkeletonPanel className="h-48" />
      </div>
    </div>
  );
}
