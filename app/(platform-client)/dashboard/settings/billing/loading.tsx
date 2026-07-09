import {
  SkeletonPageHeader,
  SkeletonBlock,
  SkeletonPanel,
} from "@/components/platform/Skeleton";

// Matches BillingClient's real shape: a single "current plan + usage
// bar" card (no stat-card grid — BillingClient has never rendered
// one), followed by either the plan-picker/payment form or the
// reseller-managed note, both approximated by SkeletonPanel.
export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader descriptionWidth="w-full max-w-lg" />
      <div className="mt-8 flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="mt-2 h-6 w-24" />
          <SkeletonBlock className="mt-5 h-2 w-full rounded-full" />
        </div>
        <SkeletonPanel className="h-56" />
      </div>
    </div>
  );
}
