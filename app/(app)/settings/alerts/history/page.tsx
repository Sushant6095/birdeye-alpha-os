"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtTimeAgo } from "@/lib/format";

interface HistoryRow {
  id: string;
  ruleId: string | null;
  type: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown> | null;
  firedAt: string;
}

export default function AlertHistoryPage() {
  const { data, isLoading, error } = useQuery<{ items: HistoryRow[] }>({
    queryKey: ["alert-history"],
    queryFn: async () => {
      const r = await fetch("/api/alerts/history");
      if (!r.ok) throw new Error(`history ${r.status}`);
      return r.json();
    },
    staleTime: 10_000,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Alert history</h1>
        <p className="text-sm text-muted-foreground">
          Last 7 days of fired alerts.
        </p>
      </header>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400">{(error as Error).message}</p>
      )}
      <ul className="space-y-2">
        {(data?.items ?? []).map((row) => (
          <li
            key={row.id}
            className="rounded-md border bg-secondary/20 p-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium">{row.title}</div>
              {row.body && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {row.body}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {row.type} · {fmtTimeAgo(new Date(row.firedAt).getTime() / 1000)} ago
              </p>
            </div>
          </li>
        ))}
        {!isLoading && (data?.items?.length ?? 0) === 0 && (
          <li className="text-sm text-muted-foreground">No alerts yet.</li>
        )}
      </ul>
    </div>
  );
}
