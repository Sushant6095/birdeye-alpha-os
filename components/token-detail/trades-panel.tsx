"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTradeStream } from "@/lib/ws/hooks";
import { fmtTimeAgo, fmtUsd, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TxRow {
  txHash?: string;
  blockUnixTime?: number;
  side?: string;
  source?: string;
  owner?: string;
  volumeUsd?: number;
  base?: Record<string, unknown>;
  quote?: Record<string, unknown>;
  [k: string]: unknown;
}

const MAX_ROWS = 200;
const WHALE_MIN_USD = 10_000;

export function TradesPanel({
  chain,
  address,
}: {
  chain: string;
  address: string;
}) {
  const [whales, setWhales] = useState(false);
  const [olderRows, setOlderRows] = useState<TxRow[]>([]);
  const [liveRows, setLiveRows] = useState<TxRow[]>([]);
  const seen = useRef<Set<string>>(new Set());

  // initial fill
  const initial = useQuery<{ data: { items?: TxRow[] }; mode: string }>({
    queryKey: ["trades", chain, address, whales ? "whales" : "recent"],
    queryFn: async () => {
      const usp = new URLSearchParams({
        chain,
        address,
        mode: whales ? "whales" : "recent",
        limit: "30",
      });
      if (whales) usp.set("minUsd", String(WHALE_MIN_USD));
      const r = await fetch(`/api/token/trades?${usp}`);
      if (!r.ok) throw new Error(`trades ${r.status}`);
      return r.json();
    },
    staleTime: 15_000,
  });

  const initialRows = initial.data?.data?.items ?? [];

  // reset live cache on toggle
  useEffect(() => {
    setLiveRows([]);
    setOlderRows([]);
    seen.current.clear();
    for (const row of initialRows) {
      if (row.txHash) seen.current.add(row.txHash);
    }
  }, [whales, initialRows]);

  // append live ws
  const stream = useTradeStream(address, chain);
  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const row = ev.data as TxRow;
    if (whales && (num(row.volumeUsd) ?? 0) < WHALE_MIN_USD) return;
    const key = row.txHash ?? `${row.blockUnixTime}-${Math.random()}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    setLiveRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
  }, [stream.data, whales]);

  // scroll-back: load older via seek-by-time
  const earliestTime = (() => {
    const all = [...liveRows, ...initialRows, ...olderRows];
    let min: number | undefined;
    for (const r of all) {
      const t = num(r.blockUnixTime);
      if (t != null && (min == null || t < min)) min = t;
    }
    return min;
  })();
  async function loadOlder() {
    if (!earliestTime) return;
    const usp = new URLSearchParams({
      chain,
      address,
      mode: "seek",
      before: String(earliestTime),
      limit: "30",
    });
    const r = await fetch(`/api/token/trades?${usp}`);
    if (!r.ok) return;
    const j = (await r.json()) as { data?: { items?: TxRow[] } };
    const got = j.data?.items ?? [];
    setOlderRows((prev) => [
      ...prev,
      ...got.filter(
        (row) => !row.txHash || !seen.current.has(row.txHash),
      ),
    ]);
    for (const row of got) if (row.txHash) seen.current.add(row.txHash);
  }

  const merged = useMemo(() => {
    const combined = [...liveRows, ...initialRows, ...olderRows];
    return combined
      .slice()
      .sort((a, b) => (num(b.blockUnixTime) ?? 0) - (num(a.blockUnixTime) ?? 0))
      .slice(0, MAX_ROWS);
  }, [liveRows, initialRows, olderRows]);

  return (
    <div className="rounded-md border bg-secondary/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Live trades
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              stream.status === "open"
                ? "text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                stream.status === "open"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-muted-foreground/40",
              )}
            />
            ws {stream.status}
          </span>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={whales}
              onChange={(e) => setWhales(e.target.checked)}
              className="accent-emerald-400"
            />
            <span>Whales only ≥ {fmtUsd(WHALE_MIN_USD)}</span>
          </label>
        </div>
      </div>

      {initial.isLoading && (
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      )}
      {initial.error && (
        <p className="text-xs text-red-400">
          {(initial.error as Error).message}
        </p>
      )}

      <ul className="text-xs font-mono divide-y divide-border/50">
        {merged.map((row, i) => {
          const side = (row.side ?? "").toLowerCase();
          const positive = side === "buy" || side === "in";
          return (
            <li
              key={`${row.txHash ?? i}-${row.blockUnixTime}`}
              className="flex items-center gap-2 py-1.5"
            >
              <span className="text-muted-foreground tabular-nums w-12">
                {fmtTimeAgo(num(row.blockUnixTime))}
              </span>
              <span
                className={cn(
                  "uppercase text-[10px] w-10",
                  positive ? "text-emerald-400" : "text-red-400",
                )}
              >
                {side || "—"}
              </span>
              <span className="text-muted-foreground w-24 truncate">
                {String(row.source ?? "—")}
              </span>
              <span className="flex-1 truncate">
                {shortAddr(row.owner, 4, 4)}
              </span>
              <span className="tabular-nums w-20 text-right">
                {fmtUsd(num(row.volumeUsd))}
              </span>
            </li>
          );
        })}
        {!initial.isLoading && merged.length === 0 && (
          <li className="text-muted-foreground py-3 text-center">
            No trades yet.
          </li>
        )}
      </ul>

      {merged.length > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={loadOlder}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Load older →
          </button>
        </div>
      )}
    </div>
  );
}
