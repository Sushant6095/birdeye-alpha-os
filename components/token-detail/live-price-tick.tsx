"use client";

import { useEffect, useRef, useState } from "react";
import {
  usePriceStream,
  useTokenStatsStream,
  type PriceEvent,
  type TokenStatsEvent,
} from "@/lib/ws/hooks";
import { fmtCount, fmtPct, fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  chain: string;
  address: string;
  initialPrice?: number;
  initialChange?: number;
  initialMc?: number;
  initialHolders?: number;
}

/** Header price + 24h % + live MCap/holders that tick from WS. */
export function LivePriceTick({
  chain,
  address,
  initialPrice,
  initialChange,
  initialMc,
  initialHolders,
}: Props) {
  const price = usePriceStream(address, chain, "1m");
  const stats = useTokenStatsStream(address, chain);

  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const lastPxRef = useEffectRef(initialPrice);

  const livePx =
    extractPrice(price.data) ?? extractPrice(price.buffer[0]) ?? initialPrice;

  useEffect(() => {
    if (livePx == null || lastPxRef.current == null) {
      lastPxRef.current = livePx ?? null;
      return;
    }
    if (Math.abs(livePx - (lastPxRef.current ?? 0)) < 1e-12) return;
    setFlash(livePx > (lastPxRef.current ?? 0) ? "up" : "down");
    lastPxRef.current = livePx;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [livePx, lastPxRef]);

  const liveMc = extractMc(stats.data) ?? initialMc;
  const liveHolders = extractHolders(stats.data) ?? initialHolders;

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div
        className={cn(
          "text-3xl font-semibold tabular-nums transition-colors",
          flash === "up" && "text-emerald-400",
          flash === "down" && "text-red-400",
        )}
      >
        {fmtUsd(livePx, { precise: true })}
      </div>
      <div
        className={cn(
          "text-sm tabular-nums",
          (initialChange ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
        )}
      >
        {fmtPct(initialChange)}
      </div>
      <div className="ml-2 text-xs text-muted-foreground">
        MC <span className="text-foreground">{fmtUsd(liveMc)}</span> · Holders{" "}
        <span className="text-foreground">{fmtCount(liveHolders)}</span>
      </div>
      {price.status === "open" && (
        <span className="ml-1 text-[10px] text-emerald-400 inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      )}
    </div>
  );
}

function extractPrice(ev: PriceEvent | null | undefined): number | undefined {
  if (!ev?.data) return undefined;
  const c = ev.data.c;
  return typeof c === "number" ? c : undefined;
}

function extractMc(
  ev: TokenStatsEvent | null | undefined,
): number | undefined {
  if (!ev?.data) return undefined;
  const d = ev.data as Record<string, unknown>;
  const v =
    (d["mc"] as number | undefined) ??
    (d["marketCap"] as number | undefined) ??
    (d["market_cap"] as number | undefined);
  return typeof v === "number" ? v : undefined;
}

function extractHolders(
  ev: TokenStatsEvent | null | undefined,
): number | undefined {
  if (!ev?.data) return undefined;
  const d = ev.data as Record<string, unknown>;
  const v =
    (d["holder"] as number | undefined) ??
    (d["holders"] as number | undefined);
  return typeof v === "number" ? v : undefined;
}

function useEffectRef<T>(initial: T | undefined) {
  const ref = useRef<T | null>(initial ?? null);
  return ref;
}
