// app/(marketing)/loading.tsx
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* MBR Studio logo mark */}
        <div className="flex h-20 w-26 items-center justify-center rounded-2xl border border-border bg-card text-2xl font-bold text-foreground animate-pulse">
          MBR
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
        <p className="text-sm text-secondary-text font-medium">Loading…</p>
      </div>
    </div>
  );
}
