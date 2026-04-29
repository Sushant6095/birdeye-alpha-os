"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { fmtCount, fmtPct, fmtUsd, shortAddr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface DrawerProps {
  chain: string;
  wallet: string;
  onClose: () => void;
}

interface ProfileResponse {
  portfolio: { items?: Array<Record<string, unknown>>; totalUsd?: number } | null;
  pnl: Record<string, unknown> | null;
}

export function HolderDrawer({ chain, wallet, onClose }: DrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { data, isLoading, error } = useQuery<ProfileResponse>({
    queryKey: ["holder-profile", chain, wallet],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/holder-positions?chain=${chain}&wallet=${wallet}`,
      );
      if (!r.ok) throw new Error(`profile ${r.status}`);
      return r.json();
    },
  });

  const portfolio = data?.portfolio?.items ?? [];
  const totalUsd = data?.portfolio?.totalUsd;
  const pnl = data?.pnl ?? {};

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-background border-l border-border overflow-y-auto"
      >
        <header className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Holder profile
            </p>
            <p className="font-mono text-sm">{shortAddr(wallet, 8, 8)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/wallet/${chain}/${wallet}`}
              className="text-muted-foreground hover:text-foreground"
              title="Open Wallet Profiler (Part 6)"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="p-4 space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
            24h PnL
          </h4>
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat
                label="Realized"
                value={fmtUsd(num(pnl?.realized_pnl))}
              />
              <Stat
                label="Unrealized"
                value={fmtUsd(num(pnl?.unrealized_pnl))}
              />
              <Stat label="Win rate" value={fmtPct(num(pnl?.win_rate))} />
              <Stat label="Trades" value={fmtCount(num(pnl?.trade_count))} />
            </div>
          )}
        </section>

        <section className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
              Portfolio
            </h4>
            <span className="text-xs tabular-nums">
              {totalUsd != null ? fmtUsd(totalUsd) : ""}
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {portfolio.slice(0, 30).map((p, i) => {
                const sym = String(p["symbol"] ?? "—");
                const valueUsd = num(p["valueUsd"]);
                const ui = num(p["uiAmount"]);
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between py-1.5 text-xs"
                  >
                    <span className="font-mono">{sym}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {fmtCount(ui)}
                    </span>
                    <span className="tabular-nums w-20 text-right">
                      {fmtUsd(valueUsd)}
                    </span>
                  </li>
                );
              })}
              {portfolio.length === 0 && (
                <li className="text-xs text-muted-foreground py-2">
                  No portfolio data.
                </li>
              )}
            </ul>
          )}
          {error && (
            <p className="text-xs text-red-400">{(error as Error).message}</p>
          )}
        </section>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-secondary/40 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">
        {label}
      </div>
      <div className="text-sm tabular-nums">{value}</div>
    </div>
  );
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
