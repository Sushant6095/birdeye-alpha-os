"use client";

import { memo } from "react";
import Link from "next/link";
import { fmtTimeAgo, fmtUsd, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TapeTrade {
  txHash?: string;
  blockUnixTime?: number;
  side?: string;
  source?: string;
  owner?: string;
  volumeUsd?: number;
  base?: { address?: string; symbol?: string };
  quote?: { address?: string; symbol?: string };
  /** server-side route may attach the address; fallback to base/quote later */
  address?: string;
  chain?: string;
}

interface RowProps {
  trade: TapeTrade;
  chain: string;
  whaleMin: number;
}

/** Memoized so a 100/sec firehose doesn't re-render every visible row. */
export const TradeRow = memo(function TradeRow({
  trade,
  chain,
  whaleMin,
}: RowProps) {
  const side = (trade.side ?? "").toLowerCase();
  const positive = side === "buy";
  const vol = num(trade.volumeUsd) ?? 0;
  const isWhale = vol >= whaleMin;
  const tokenAddr =
    trade.address ?? trade.base?.address ?? trade.quote?.address ?? "";
  const tokenSym = trade.base?.symbol ?? trade.quote?.symbol ?? "—";

  return (
    <li
      className={cn(
        "flex items-center gap-2 py-1 text-xs font-mono",
        isWhale && "bg-amber-500/5",
      )}
    >
      <span className="text-muted-foreground tabular-nums w-12 shrink-0">
        {fmtTimeAgo(num(trade.blockUnixTime))}
      </span>
      <span
        className={cn(
          "uppercase text-[10px] w-10 shrink-0",
          positive
            ? "text-emerald-400"
            : side
              ? "text-red-400"
              : "text-muted-foreground",
        )}
      >
        {side || "—"}
      </span>
      <span className="text-muted-foreground w-16 truncate">
        {String(trade.source ?? "—")}
      </span>
      <Link
        href={`/token/${chain}/${tokenAddr}`}
        className="flex-1 truncate hover:text-foreground"
      >
        {tokenSym}
      </Link>
      <Link
        href={`/wallet/${chain}/${trade.owner ?? ""}`}
        className="w-20 truncate hover:text-foreground text-muted-foreground"
      >
        {shortAddr(trade.owner, 4, 4)}
      </Link>
      <span className="tabular-nums w-20 text-right inline-flex items-center justify-end gap-1">
        {isWhale && <span title="whale">🐋</span>}
        {fmtUsd(vol)}
      </span>
    </li>
  );
});
