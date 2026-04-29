"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fmtCount, fmtTimeAgo, num, shortAddr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface Transfer {
  txHash?: string;
  blockUnixTime?: number;
  from?: string;
  to?: string;
  amount?: string | number;
  uiAmount?: number;
}

interface TransfersResponse {
  data: { items?: Transfer[] };
  items: Transfer[];
  total: number;
}

export function TransfersPanel({
  chain,
  address,
}: {
  chain: string;
  address: string;
}) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery<TransfersResponse>({
    queryKey: ["transfers", chain, address],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/transfers?chain=${chain}&address=${address}&limit=50`,
      );
      if (!r.ok) throw new Error(`transfers ${r.status}`);
      return r.json();
    },
    enabled: open,
    staleTime: 60_000,
  });

  const items = data?.items ?? [];

  return (
    <div className="rounded-md border bg-secondary/20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground hover:bg-secondary/40"
      >
        <span className="inline-flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Recent transfers
        </span>
        {data && (
          <span className="text-[10px] normal-case">
            total {fmtCount(data.total)}
          </span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          {isLoading && (
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          )}
          {error && (
            <p className="text-xs text-red-400">{(error as Error).message}</p>
          )}
          <ul className="text-xs font-mono divide-y divide-border/50">
            {items.map((t, i) => (
              <li
                key={`${t.txHash ?? i}-${t.blockUnixTime}`}
                className="flex items-center gap-2 py-1.5"
              >
                <span className="text-muted-foreground tabular-nums w-12">
                  {fmtTimeAgo(num(t.blockUnixTime))}
                </span>
                <span className="text-muted-foreground w-16 truncate">
                  {shortAddr(t.from, 4, 4)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="flex-1 truncate">
                  {shortAddr(t.to, 4, 4)}
                </span>
                <span className="tabular-nums">{fmtCount(num(t.uiAmount))}</span>
              </li>
            ))}
            {!isLoading && items.length === 0 && (
              <li className="text-muted-foreground py-3">
                No transfers returned.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
