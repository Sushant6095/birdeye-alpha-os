import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <header className="border-b border-border bg-background/60 backdrop-blur sticky top-14 z-20">
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function DeployerSkeleton() {
  return (
    <div className="rounded-md border border-border p-3 surface">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="rounded-md border border-border p-4 surface space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiquiditySkeleton() {
  return (
    <div className="rounded-md border border-border p-3 surface">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-28" />
      <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
    </div>
  );
}

export function MemeSkeleton() {
  return (
    <div className="rounded-md border border-border p-4 surface">
      <Skeleton className="h-4 w-32" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
