"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TokenLike {
  address: string;
  symbol?: string;
  name?: string;
  logoURI?: string;
  logo_uri?: string;
  price?: number;
  priceChange24hPercent?: number;
  price_change_24h_percent?: number;
  v24hUSD?: number;
  volume_24h_usd?: number;
  liquidity?: number;
  mc?: number;
  marketCap?: number;
  market_cap?: number;
  smartMoney?: boolean;
  history?: number[];
  /** "history_24h" or similar — best-effort. */
  sparkline?: number[];
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function fmtUsd(v?: number): string {
  if (v == null) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}b`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}m`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}k`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v > 0) return `$${v.toPrecision(3)}`;
  return "$0";
}

function fmtPct(v?: number): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function TokenCard({
  token,
  chain,
  rank,
}: {
  token: TokenLike;
  chain: string;
  rank?: number;
}) {
  const sym = token.symbol ?? "—";
  const logo = token.logoURI ?? token.logo_uri;
  const price = num(token.price);
  const change =
    num(token.priceChange24hPercent) ?? num(token.price_change_24h_percent);
  const vol = num(token.v24hUSD) ?? num(token.volume_24h_usd);
  const mc =
    num(token.mc) ?? num(token.marketCap) ?? num(token.market_cap);
  const sparkline = token.sparkline ?? token.history;
  const positive = (change ?? 0) >= 0;

  return (
    <Link
      href={`/token/${chain}/${token.address}`}
      className="block focus-visible:outline-none"
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {rank != null && (
              <span className="text-xs tabular-nums text-muted-foreground w-5 shrink-0">
                {rank}
              </span>
            )}
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className="h-8 w-8 rounded-full bg-secondary border border-border object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-secondary border border-border shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
                {sym.slice(0, 3)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium truncate">{sym}</span>
                {token.smartMoney && (
                  <Badge variant="success" className="gap-1 px-1 py-0 h-4">
                    <Brain className="h-2.5 w-2.5" />
                    SM
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {token.name ?? token.address}
              </div>
            </div>
          </div>

          <Sparkline values={sparkline ?? []} className="hidden sm:block" />

          <div className="text-right shrink-0 w-24">
            <div className="text-sm tabular-nums">{fmtUsd(price)}</div>
            <div
              className={cn(
                "text-xs tabular-nums",
                positive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {fmtPct(change)}
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end shrink-0 w-20">
            <span className="text-[10px] uppercase text-muted-foreground">
              vol
            </span>
            <span className="text-xs tabular-nums">{fmtUsd(vol)}</span>
          </div>
          <div className="hidden lg:flex flex-col items-end shrink-0 w-20">
            <span className="text-[10px] uppercase text-muted-foreground">
              mc
            </span>
            <span className="text-xs tabular-nums">{fmtUsd(mc)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
