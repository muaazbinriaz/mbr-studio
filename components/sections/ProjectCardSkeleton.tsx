// components/sections/ProjectCardSkeleton.tsx
export function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card">
      <div className="aspect-[4/3] w-full bg-secondary-background" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-24 rounded bg-secondary-background" />
        <div className="h-4 w-3/4 rounded bg-secondary-background" />
        <div className="h-3 w-full rounded bg-secondary-background" />
        <div className="h-3 w-1/2 rounded bg-secondary-background" />
      </div>
    </div>
  );
}
