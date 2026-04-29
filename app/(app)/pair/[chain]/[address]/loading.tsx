import { Skeleton } from "@/components/ui/skeleton";

export default function PairLoading() {
  return (
    <div className="pb-12">
      <div className="border-b border-border px-4 sm:px-6 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
