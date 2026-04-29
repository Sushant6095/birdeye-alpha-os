import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <div className="pb-12">
      <div className="border-b border-border px-4 sm:px-6 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-7 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 space-y-3">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
