"use client";

import { useQuery } from "@tanstack/react-query";
import { fmtCount, fmtPct, fmtUsd, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AllTimeTrades,
  TokenMarketData,
  TokenTradeData,
} from "./types";

interface PriceWindow {
  priceChangePercent?: number;
  volumeUSD?: number;
  volumeChangePercent?: number;
  [k: string]: unknown;
}

interface StatsProps {
  chain: string;
  address: string;
  marketData: TokenMarketData | null;
  tradeData: TokenTradeData | null;
  allTime: AllTimeTrades | null;
}

export function StatsPanel({
  chain,
  address,
  marketData,
  tradeData,
  allTime,
}: StatsProps) {
  const priceStats = useQuery<{ windows: Record<string, PriceWindow | null> }>({
    queryKey: ["token-price-stats", chain, address],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/price-stats?chain=${chain}&address=${address}`,
      );
      if (!r.ok) throw new Error(`price-stats ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const buy = num(tradeData?.buy_volume_24h);
  const sell = num(tradeData?.sell_volume_24h);
  const buySellRatio =
    buy != null && sell != null && sell > 0 ? buy / sell : undefined;

  return (
    <div className="rounded-md border bg-secondary/20 p-4 space-y-4">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
        Stats
      </h3>

      <Grid>
        <Stat label="Market cap" value={fmtUsd(num(marketData?.marketcap) ?? num(marketData?.circulating_marketcap))} />
        <Stat
          label="FDV"
          value={fmtUsd(num(marketData?.fdv) ?? num(marketData?.marketcap))}
        />
        <Stat label="Liquidity" value={fmtUsd(num(marketData?.liquidity))} />
        <Stat
          label="Supply"
          value={fmtCount(
            num(marketData?.circulating_supply) ?? num(marketData?.supply),
          )}
        />
        <Stat
          label="Holders"
          value={fmtCount(
            num((marketData as { holder?: number })?.holder) ??
              num((tradeData as { holder?: number })?.holder),
          )}
        />
        <Stat
          label="Unique 24h"
          value={fmtCount(num(tradeData?.unique_wallet_24h))}
        />
      </Grid>

      <Section title="Price change">
        <div className="grid grid-cols-4 gap-2">
          {(["1h", "4h", "8h", "24h"] as const).map((w) => {
            const win = priceStats.data?.windows?.[w] ?? null;
            const v = num(win?.priceChangePercent);
            return (
              <div key={w} className="rounded bg-secondary/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">
                  {w}
                </div>
                <div
                  className={cn(
                    "text-sm tabular-nums",
                    (v ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {fmtPct(v)}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="24h volume">
        <Grid>
          <Stat
            label="Volume"
            value={fmtUsd(num(tradeData?.volume_24h_usd))}
          />
          <Stat label="Trades" value={fmtCount(num(tradeData?.trade_24h))} />
          <Stat label="Buys" value={fmtCount(num(tradeData?.buy_24h))} />
          <Stat label="Sells" value={fmtCount(num(tradeData?.sell_24h))} />
        </Grid>
        <BuySellBar
          buy={buy}
          sell={sell}
          ratio={buySellRatio}
          className="mt-3"
        />
      </Section>

      <Section title="Lifetime">
        <Grid>
          <Stat
            label="Trades"
            value={fmtCount(num(allTime?.total_trades))}
          />
          <Stat
            label="Volume"
            value={fmtUsd(num(allTime?.total_volume_usd))}
          />
        </Grid>
      </Section>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function BuySellBar({
  buy,
  sell,
  ratio,
  className,
}: {
  buy?: number;
  sell?: number;
  ratio?: number;
  className?: string;
}) {
  if (buy == null && sell == null) return null;
  const total = (buy ?? 0) + (sell ?? 0);
  const buyPct = total > 0 ? ((buy ?? 0) / total) * 100 : 50;
  return (
    <div className={className}>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>Buy {fmtUsd(buy)}</span>
        <span>{ratio != null ? `${ratio.toFixed(2)}× B/S` : ""}</span>
        <span>Sell {fmtUsd(sell)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary">
        <div className="bg-emerald-400" style={{ width: `${buyPct}%` }} />
        <div className="bg-red-400" style={{ width: `${100 - buyPct}%` }} />
      </div>
    </div>
  );
}
