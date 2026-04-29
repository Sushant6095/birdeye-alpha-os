import { Skeleton } from "@/components/ui/skeleton";

export default function TokenLoading() {
  return (
    <div className="pb-12">
      <div className="border-b border-border px-4 sm:px-6 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/5" />
      </div>
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-[360px]" />
          <Skeleton className="h-72" />
        </div>
        <aside className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </aside>
      </div>
    </div>
  );
}
