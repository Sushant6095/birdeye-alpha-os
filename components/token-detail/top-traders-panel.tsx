"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fmtCount, fmtPct, fmtUsd, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Window = "1h" | "4h" | "8h" | "24h";

interface Row {
  owner?: string;
  address?: string;
  pnl?: number;
  realized_pnl?: number;
  volume?: number;
  trade_count?: number;
  win_rate?: number;
}

export function TopTradersPanel({
  chain,
  address,
}: {
  chain: string;
  address: string;
}) {
  const [time, setTime] = useState<Window>("24h");
  const { data, isLoading, error } = useQuery<{ data: { items?: Row[] } }>({
    queryKey: ["top-traders", chain, address, time],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/top-traders?chain=${chain}&address=${address}&time=${time}&limit=25`,
      );
      if (!r.ok) throw new Error(`top-traders ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const rows = data?.data?.items ?? [];

  return (
    <div className="rounded-md border bg-secondary/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Top traders
        </h3>
        <div className="flex gap-1">
          {(["1h", "4h", "8h", "24h"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setTime(w)}
              className={cn(
                "rounded px-2 py-0.5 text-xs",
                time === w
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <SkeletonRows />}
      {error && (
        <p className="text-xs text-red-400">{(error as Error).message}</p>
      )}

      <ul className="text-xs divide-y divide-border/50 font-mono">
        {rows.map((row, i) => {
          const wallet = row.owner ?? row.address ?? "";
          const pnl = num(row.pnl) ?? num(row.realized_pnl);
          return (
            <li
              key={`${wallet}-${i}`}
              className="flex items-center gap-2 py-1.5"
            >
              <span className="text-muted-foreground tabular-nums w-6">
                {i + 1}
              </span>
              <Link
                href={`/wallet/${chain}/${wallet}`}
                className="flex-1 truncate hover:text-foreground"
              >
                {shortAddr(wallet, 4, 4)}
              </Link>
              <span className="tabular-nums w-20 text-right">
                {fmtUsd(num(row.volume))}
              </span>
              <span className="tabular-nums w-16 text-right text-muted-foreground">
                {fmtCount(num(row.trade_count))}
              </span>
              <span className="tabular-nums w-16 text-right text-muted-foreground">
                {fmtPct(num(row.win_rate))}
              </span>
              <span
                className={cn(
                  "tabular-nums w-20 text-right",
                  (pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {fmtUsd(pnl)}
              </span>
            </li>
          );
        })}
        {!isLoading && rows.length === 0 && (
          <li className="text-muted-foreground py-3">
            No top trader data for this window.
          </li>
        )}
      </ul>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-6" />
      ))}
    </div>
  );
}
