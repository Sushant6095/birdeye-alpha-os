"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, ArrowDown, ArrowUp } from "lucide-react";
import { fmtCount, fmtTimeAgo, num, shortAddr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface Transfer {
  txHash?: string;
  blockUnixTime?: number;
  from?: string;
  to?: string;
  uiAmount?: number;
  symbol?: string;
  address?: string;
}

interface Resp {
  data: { items?: Transfer[] };
  totals: {
    totalIn: number;
    totalOut: number;
    inCount: number;
    outCount: number;
    sample: number;
  };
}

export function TransfersTab({
  chain,
  wallet,
}: {
  chain: string;
  wallet: string;
}) {
  const { data, isLoading, error } = useQuery<Resp>({
    queryKey: ["transfers", chain, wallet],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/transfers?chain=${chain}&wallet=${wallet}&limit=100`,
      );
      if (!r.ok) throw new Error(`transfers ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const items = data?.data?.items ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat
          label="In count"
          value={fmtCount(totals?.inCount)}
          icon={ArrowDown}
          tone="success"
        />
        <Stat
          label="Out count"
          value={fmtCount(totals?.outCount)}
          icon={ArrowUp}
          tone="danger"
        />
        <Stat
          label="In total"
          value={fmtCount(totals?.totalIn)}
          icon={ArrowLeftRight}
        />
        <Stat
          label="Out total"
          value={fmtCount(totals?.totalOut)}
          icon={ArrowLeftRight}
        />
      </div>

      <div className="rounded-md border bg-secondary/20 p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Recent transfers
        </h3>
        {isLoading && (
          <div className="space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-xs text-red-400">{(error as Error).message}</p>
        )}
        <ul className="text-xs font-mono divide-y divide-border/50">
          {items.map((t, i) => {
            const direction =
              t.to?.toLowerCase() === wallet.toLowerCase() ? "in" : "out";
            return (
              <li
                key={`${t.txHash ?? i}-${t.blockUnixTime}`}
                className="flex items-center gap-2 py-1.5"
              >
                <span className="text-muted-foreground tabular-nums w-12">
                  {fmtTimeAgo(num(t.blockUnixTime))}
                </span>
                <span
                  className={
                    direction === "in" ? "text-emerald-400 w-8" : "text-red-400 w-8"
                  }
                >
                  {direction}
                </span>
                <span className="text-muted-foreground w-24 truncate">
                  {shortAddr(t.from, 4, 4)} → {shortAddr(t.to, 4, 4)}
                </span>
                <span className="flex-1 truncate">{t.symbol ?? ""}</span>
                <span className="tabular-nums">{fmtCount(num(t.uiAmount))}</span>
              </li>
            );
          })}
          {!isLoading && items.length === 0 && (
            <li className="text-muted-foreground py-3 text-center">
              No transfers.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof ArrowDown;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-md border bg-secondary/20 p-3">
      <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground tracking-wider">
        <span>{label}</span>
        <Icon
          className={
            tone === "success"
              ? "h-3 w-3 text-emerald-400"
              : tone === "danger"
                ? "h-3 w-3 text-red-400"
                : "h-3 w-3"
          }
        />
      </div>
      <div className="mt-1 text-sm tabular-nums">{value}</div>
    </div>
  );
}
