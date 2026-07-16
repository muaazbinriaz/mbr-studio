import {
  SkeletonHero,
  SkeletonFormWithSidebar,
} from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
      <SkeletonHero align="left" maxWidth="max-w-2xl" />
      <div className="mt-12">
        <SkeletonFormWithSidebar />
      </div>
    </div>
  );
}
