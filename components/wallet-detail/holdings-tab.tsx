"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCount, fmtPct, fmtUsd, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "./load-bundle";

interface PortfolioResponse {
  data: { items?: PortfolioItem[]; totalUsd?: number };
}

const PALETTE = [
  "bg-emerald-500",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-orange-400",
  "bg-red-400",
  "bg-red-500",
  "bg-blue-400",
  "bg-violet-400",
];

export function HoldingsTab({
  chain,
  wallet,
  initial,
}: {
  chain: string;
  wallet: string;
  initial: PortfolioItem[];
}) {
  const { data, isFetching } = useQuery<PortfolioResponse>({
    queryKey: ["portfolio", chain, wallet],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/portfolio?chain=${chain}&wallet=${wallet}`,
      );
      if (!r.ok) throw new Error(`portfolio ${r.status}`);
      return r.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    initialData: { data: { items: initial } },
  });

  const items = data?.data?.items ?? initial ?? [];
  const totalUsd =
    num(data?.data?.totalUsd) ??
    items.reduce((s, p) => s + (num(p.valueUsd) ?? 0), 0);

  const breakdown = useMemo(() => {
    const ranked = [...items]
      .map((p) => ({ ...p, valueUsd: num(p.valueUsd) ?? 0 }))
      .filter((p) => p.valueUsd > 0)
      .sort((a, b) => b.valueUsd - a.valueUsd);
    const top = ranked.slice(0, 7);
    const rest = ranked.slice(7);
    const restTotal = rest.reduce((s, p) => s + p.valueUsd, 0);
    const slices = [
      ...top.map((p, i) => ({
        symbol: p.symbol ?? "—",
        valueUsd: p.valueUsd,
        color: PALETTE[i % PALETTE.length] ?? "bg-secondary",
      })),
    ];
    if (restTotal > 0) {
      slices.push({
        symbol: `+${rest.length} more`,
        valueUsd: restTotal,
        color: "bg-secondary/70",
      });
    }
    return slices;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-secondary/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
            Net-worth breakdown
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {isFetching ? "refreshing…" : "auto-refresh 30s"}
          </span>
        </div>
        {breakdown.length === 0 ? (
          <p className="text-xs text-muted-foreground">No holdings.</p>
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden bg-secondary">
              {breakdown.map((s, i) => (
                <div
                  key={i}
                  className={s.color}
                  style={{
                    width: `${(s.valueUsd / Math.max(1, totalUsd)) * 100}%`,
                  }}
                  title={`${s.symbol} · ${fmtUsd(s.valueUsd)}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
              {breakdown.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span className={cn("h-2 w-2 rounded-sm", s.color)} />
                  {s.symbol}{" "}
                  {fmtPct((s.valueUsd / Math.max(1, totalUsd)) * 100)}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-md border bg-secondary/20">
        <header className="px-4 py-3 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
            Holdings
          </h3>
          <span className="text-xs tabular-nums">{fmtUsd(totalUsd)}</span>
        </header>
        {isFetching && items.length === 0 && (
          <div className="px-4 pb-4 space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7" />
            ))}
          </div>
        )}
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <th className="text-left font-normal px-4 py-2">Token</th>
              <th className="text-right font-normal px-4 py-2">Balance</th>
              <th className="text-right font-normal px-4 py-2">Price</th>
              <th className="text-right font-normal px-4 py-2">Value</th>
              <th className="text-right font-normal px-4 py-2">%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => {
              const valueUsd = num(p.valueUsd);
              const pct =
                valueUsd != null && totalUsd > 0
                  ? (valueUsd / totalUsd) * 100
                  : undefined;
              return (
                <tr
                  key={`${p.address}-${i}`}
                  className="border-b border-border/30 hover:bg-secondary/30"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/token/${chain}/${p.address ?? ""}`}
                      className="inline-flex items-center gap-2 hover:text-foreground"
                    >
                      <span className="font-medium">{p.symbol ?? "—"}</span>
                      <span className="font-mono text-muted-foreground">
                        {shortAddr(p.address, 4, 4)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmtCount(num(p.uiAmount))}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmtUsd(num(p.priceUsd), { precise: true })}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmtUsd(valueUsd)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {fmtPct(pct)}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && !isFetching && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No holdings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
