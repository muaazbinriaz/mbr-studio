import { SkeletonTextPage } from "@/components/platform/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
      <SkeletonTextPage />
    </div>
  );
}
