"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useChain } from "@/components/providers/chain-provider";
import { useMemeStatsStream } from "@/lib/ws/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { fmtCount, fmtPct, fmtUsd, fmtTimeAgo, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MemeRow {
  address?: string;
  symbol?: string;
  name?: string;
  source?: string;
  price?: number;
  market_cap?: number;
  liquidity?: number;
  volume_24h_usd?: number;
  holder?: number;
  recent_listing_time?: number;
  price_change_24h_percent?: number;
  /** dev activity proxy if Birdeye returns one */
  dev_activity?: number;
  history_24h?: number[];
  [k: string]: unknown;
}

type Sort = "virality" | "age" | "marketcap" | "holders" | "trades";
const SORTS: Sort[] = ["virality", "age", "marketcap", "holders", "trades"];

const COMMON_SOURCES = [
  "all",
  "pumpfun",
  "letsbonk",
  "moonshot",
  "raydium",
  "orca",
];

export function MemesPage() {
  const { chain } = useChain();
  const [sort, setSort] = useState<Sort>("virality");
  const [source, setSource] = useState("all");

  const list = useQuery<{ data: { items?: MemeRow[] } }>({
    queryKey: ["memes-list", chain, sort, source],
    queryFn: async () => {
      const usp = new URLSearchParams({
        chain,
        sort,
        limit: "30",
        ...(source !== "all" ? { source } : {}),
      });
      const r = await fetch(`/api/memes/list?${usp}`);
      if (!r.ok) throw new Error(`memes ${r.status}`);
      return r.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // WS overlay — applies live deltas onto rows by address
  const stream = useMemeStatsStream(chain);
  const liveOverlay = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>();
    for (const ev of stream.buffer) {
      const d = (ev?.data ?? {}) as Record<string, unknown>;
      const addr = String(d["address"] ?? "").toLowerCase();
      if (!addr) continue;
      m.set(addr, d);
    }
    return m;
  }, [stream.buffer]);

  const rows = list.data?.data?.items ?? [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Memescope</h1>
          <p className="text-sm text-muted-foreground">
            Live meme tokens on {chain}. Updates from{" "}
            <code className="text-foreground">meme_stats</code> WS overlay onto
            each row.
          </p>
        </div>
        <span
          className={cn(
            "text-xs inline-flex items-center gap-1",
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
      </header>

      <div className="flex flex-wrap gap-2 items-end">
        <Field label="Sort">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Launchpad / DEX">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            {COMMON_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {list.isLoading && (
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {list.error && (
        <p className="text-xs text-red-400">{(list.error as Error).message}</p>
      )}

      <ul className="space-y-2">
        {rows.map((row, i) => (
          <MemeRow
            key={`${row.address ?? row.symbol ?? i}-${i}`}
            row={row}
            chain={chain}
            rank={i + 1}
            overlay={
              row.address ? liveOverlay.get(row.address.toLowerCase()) : undefined
            }
          />
        ))}
        {!list.isLoading && rows.length === 0 && (
          <li className="text-xs text-muted-foreground text-center py-6">
            No meme tokens match these filters.
          </li>
        )}
      </ul>
    </div>
  );
}

function MemeRow({
  row,
  chain,
  rank,
  overlay,
}: {
  row: MemeRow;
  chain: string;
  rank: number;
  overlay?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const sym = row.symbol ?? "—";
  const price = num((overlay?.["price"] as number | undefined) ?? row.price);
  const change = num(
    (overlay?.["price_change_24h_percent"] as number | undefined) ??
      row.price_change_24h_percent,
  );
  const mc = num(
    (overlay?.["market_cap"] as number | undefined) ?? row.market_cap,
  );
  const liq = num((overlay?.["liquidity"] as number | undefined) ?? row.liquidity);
  const vol = num(
    (overlay?.["volume_24h_usd"] as number | undefined) ?? row.volume_24h_usd,
  );
  const holders = num((overlay?.["holder"] as number | undefined) ?? row.holder);
  const sparkline = row.history_24h ?? [];

  return (
    <li className="rounded-md border bg-secondary/20 hover:bg-secondary/30">
      <div className="flex items-center gap-3 p-3 text-xs">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground"
          aria-label="expand"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <span className="text-muted-foreground tabular-nums w-6">{rank}</span>
        <Link
          href={row.address ? `/token/${chain}/${row.address}` : "#"}
          className="flex items-center gap-2 min-w-0 flex-1 hover:text-foreground"
        >
          <span className="font-medium truncate">{sym}</span>
          <span className="font-mono text-muted-foreground truncate">
            {row.name && row.name !== sym ? row.name : shortAddr(row.address, 4, 4)}
          </span>
          {row.source && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1">
              {String(row.source)}
            </span>
          )}
        </Link>
        <Sparkline values={sparkline} className="hidden sm:block" />
        <span className="tabular-nums w-20 text-right">
          {fmtUsd(price, { precise: true })}
        </span>
        <span
          className={cn(
            "tabular-nums w-16 text-right",
            (change ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
          )}
        >
          {fmtPct(change)}
        </span>
        <span className="hidden md:inline tabular-nums w-20 text-right text-muted-foreground">
          mc {fmtUsd(mc)}
        </span>
        <span className="hidden lg:inline tabular-nums w-20 text-right text-muted-foreground">
          vol {fmtUsd(vol)}
        </span>
      </div>
      {open && (
        <div className="border-t border-border/50 px-3 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-secondary/30">
          <Stat label="Liquidity" value={fmtUsd(liq)} />
          <Stat label="Holders" value={fmtCount(holders)} />
          <Stat label="MCap" value={fmtUsd(mc)} />
          <Stat
            label="Listed"
            value={
              row.recent_listing_time
                ? `${fmtTimeAgo(row.recent_listing_time)} ago`
                : "—"
            }
          />
          {overlay && (
            <pre className="col-span-2 sm:col-span-4 text-[10px] font-mono text-muted-foreground bg-secondary/50 rounded p-2 max-h-24 overflow-auto">
              live overlay: {JSON.stringify(overlay)}
            </pre>
          )}
        </div>
      )}
    </li>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-secondary/40 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm tabular-nums">{value}</div>
    </div>
  );
}
