"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChain } from "@/components/providers/chain-provider";
import { useLargeTradeStream } from "@/lib/ws/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBatchedBuffer } from "./use-batched-buffer";
import { TradeRow, type TapeTrade } from "./trade-row";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCount, fmtTimeAgo, num } from "@/lib/format";

const CAP = 500;

export function TapePage() {
  const { chain } = useChain();
  const [minUsd, setMinUsd] = useState(0);
  const [tokenFilter, setTokenFilter] = useState("");
  const [side, setSide] = useState<"all" | "buy" | "sell">("all");
  const [whaleMin, setWhaleMin] = useState(10_000);
  const [paused, setPaused] = useState(false);

  // initial fill (refetches when filters change)
  const initial = useQuery<{ data: { items?: TapeTrade[] }; mode: string }>({
    queryKey: ["tape-recent", chain, minUsd],
    queryFn: async () => {
      const usp = new URLSearchParams({ chain, limit: "50" });
      if (minUsd > 0) usp.set("minUsd", String(minUsd));
      const r = await fetch(`/api/tape/recent?${usp}`);
      if (!r.ok) throw new Error(`tape ${r.status}`);
      return r.json();
    },
    staleTime: 10_000,
  });

  // batched live buffer
  const { items, push, reset } = useBatchedBuffer<TapeTrade>(CAP);
  const seen = useRef<Set<string>>(new Set());

  // reset buffer on chain or filters that change the upstream meaning
  useEffect(() => {
    reset();
    seen.current.clear();
    const seed = initial.data?.data?.items ?? [];
    for (const t of seed) {
      const key = t.txHash ?? `${t.blockUnixTime}-${Math.random()}`;
      if (seen.current.has(key)) continue;
      seen.current.add(key);
      push(t);
    }
  }, [chain, minUsd, initial.data, reset, push]);

  // chain-wide large_trade WS — filter min applied client-side too
  const stream = useLargeTradeStream(chain, minUsd);
  useEffect(() => {
    if (paused) return;
    const ev = stream.data;
    if (!ev?.data) return;
    const t = ev.data as TapeTrade;
    const key = t.txHash ?? `${t.blockUnixTime}-${Math.random()}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    push(t);
  }, [stream.data, paused, push]);

  // Latest block indicator
  const block = useQuery<{ block: number | null; lastBlockTime: number | null }>(
    {
      queryKey: ["tape-latest-block", chain],
      queryFn: async () => {
        const r = await fetch(`/api/tape/latest-block?chain=${chain}`);
        if (!r.ok) throw new Error(`block ${r.status}`);
        return r.json();
      },
      refetchInterval: 5_000,
      staleTime: 4_500,
    },
  );

  // client-side filter view
  const visible = useMemo(() => {
    const tokenQ = tokenFilter.trim().toLowerCase();
    return items.filter((t) => {
      if (side !== "all" && (t.side ?? "").toLowerCase() !== side) return false;
      if (minUsd > 0 && (num(t.volumeUsd) ?? 0) < minUsd) return false;
      if (tokenQ) {
        const haystack =
          `${t.base?.symbol ?? ""} ${t.quote?.symbol ?? ""} ${t.base?.address ?? ""} ${t.quote?.address ?? ""}`.toLowerCase();
        if (!haystack.includes(tokenQ)) return false;
      }
      return true;
    });
  }, [items, side, minUsd, tokenFilter]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade Tape</h1>
          <p className="text-sm text-muted-foreground">
            Chain-wide trade firehose. WS appends are rAF-batched so 100 events/sec
            stay smooth.
          </p>
        </div>
        <BlockIndicator
          block={block.data?.block ?? null}
          lastBlockTime={block.data?.lastBlockTime ?? null}
          refetching={block.isFetching}
        />
      </header>

      <Filters
        chain={chain}
        minUsd={minUsd}
        setMinUsd={setMinUsd}
        tokenFilter={tokenFilter}
        setTokenFilter={setTokenFilter}
        side={side}
        setSide={setSide}
        whaleMin={whaleMin}
        setWhaleMin={setWhaleMin}
        paused={paused}
        setPaused={setPaused}
        wsStatus={stream.status}
        bufferSize={items.length}
      />

      <div className="rounded-md border bg-secondary/20 p-3">
        {initial.isLoading && items.length === 0 && (
          <div className="space-y-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-5" />
            ))}
          </div>
        )}
        {initial.error && (
          <p className="text-xs text-red-400">
            {(initial.error as Error).message}
          </p>
        )}
        <ul className="divide-y divide-border/40">
          {visible.map((t, i) => (
            <TradeRow
              key={t.txHash ?? `${t.blockUnixTime}-${i}`}
              trade={t}
              chain={chain}
              whaleMin={whaleMin}
            />
          ))}
          {!initial.isLoading && visible.length === 0 && (
            <li className="text-xs text-muted-foreground py-3 text-center">
              No trades match these filters.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Filters(props: {
  chain: string;
  minUsd: number;
  setMinUsd: (n: number) => void;
  tokenFilter: string;
  setTokenFilter: (s: string) => void;
  side: "all" | "buy" | "sell";
  setSide: (s: "all" | "buy" | "sell") => void;
  whaleMin: number;
  setWhaleMin: (n: number) => void;
  paused: boolean;
  setPaused: (b: boolean) => void;
  wsStatus: string;
  bufferSize: number;
}) {
  const {
    chain,
    minUsd,
    setMinUsd,
    tokenFilter,
    setTokenFilter,
    side,
    setSide,
    whaleMin,
    setWhaleMin,
    paused,
    setPaused,
    wsStatus,
    bufferSize,
  } = props;
  return (
    <div className="rounded-md border bg-secondary/20 p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs items-end">
      <Field label="Chain">
        <span className="capitalize">{chain}</span>
      </Field>
      <Field label="Min USD">
        <Input
          type="number"
          value={minUsd}
          onChange={(e) => setMinUsd(Number(e.target.value) || 0)}
          className="h-8 text-xs"
          min={0}
        />
      </Field>
      <Field label="Token (sym/addr)">
        <Input
          value={tokenFilter}
          onChange={(e) => setTokenFilter(e.target.value)}
          placeholder="BONK or 0x…"
          className="h-8 text-xs"
        />
      </Field>
      <Field label="Side">
        <select
          value={side}
          onChange={(e) =>
            setSide(e.target.value as "all" | "buy" | "sell")
          }
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          <option value="all">all</option>
          <option value="buy">buy</option>
          <option value="sell">sell</option>
        </select>
      </Field>
      <Field label="🐋 ≥ USD">
        <Input
          type="number"
          value={whaleMin}
          onChange={(e) => setWhaleMin(Number(e.target.value) || 0)}
          className="h-8 text-xs"
          min={0}
        />
      </Field>
      <div className="flex items-end gap-2">
        <Button
          variant={paused ? "default" : "secondary"}
          size="sm"
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
        <span className="text-[10px] text-muted-foreground">
          ws {wsStatus} · buf {bufferSize}
        </span>
      </div>
    </div>
  );
}

function BlockIndicator({
  block,
  lastBlockTime,
  refetching,
}: {
  block: number | null;
  lastBlockTime: number | null;
  refetching: boolean;
}) {
  return (
    <div className="rounded-md border bg-secondary/20 px-3 py-2 text-xs flex items-center gap-3">
      <span className="text-muted-foreground uppercase tracking-wider">block</span>
      <span className="tabular-nums font-mono">
        #{block != null ? fmtCount(block) : "—"}
      </span>
      {lastBlockTime ? (
        <span className="text-[10px] text-muted-foreground">
          {fmtTimeAgo(lastBlockTime)} ago
        </span>
      ) : null}
      {refetching && (
        <span className="text-[10px] text-emerald-400 animate-pulse">↻</span>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
