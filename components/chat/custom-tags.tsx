"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkline } from "@/components/ui/sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCount, fmtPct, fmtUsd, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VerdictBadge({
  color,
  children,
}: {
  color: "green" | "yellow" | "red";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs font-medium border my-1",
        color === "green" && "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        color === "yellow" && "bg-amber-500/15 text-amber-300 border-amber-500/30",
        color === "red" && "bg-red-500/15 text-red-300 border-red-500/30",
      )}
    >
      {children}
    </span>
  );
}

interface OhlcvResponse {
  source: string;
  data: { items?: Record<string, unknown>[] };
}

export function ChartTag({
  token,
  chain,
  interval = "1H",
}: {
  token: string;
  chain: string;
  interval?: string;
}) {
  const { data, isLoading, error } = useQuery<OhlcvResponse>({
    queryKey: ["chat-chart", chain, token, interval],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/ohlcv?chain=${chain}&address=${token}&type=${interval}`,
      );
      if (!r.ok) throw new Error(`ohlcv ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const closes =
    data?.data?.items?.map((p) => Number(p["c"] ?? p["value"])).filter((v) =>
      Number.isFinite(v),
    ) ?? [];

  return (
    <Link
      href={`/token/${chain}/${token}`}
      className="block my-2 rounded-md border bg-secondary/30 hover:bg-secondary/50 px-3 py-2"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {interval} chart · {chain}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {shortAddr(token, 4, 4)}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : error ? (
        <p className="text-[10px] text-red-400">{(error as Error).message}</p>
      ) : closes.length < 2 ? (
        <p className="text-[10px] text-muted-foreground">No candles.</p>
      ) : (
        <Sparkline values={closes} width={320} height={36} />
      )}
    </Link>
  );
}

interface Holder {
  owner?: string;
  address?: string;
  ui_amount?: number;
  percentage?: number;
}

export function HoldersTag({
  token,
  chain,
  limit = 10,
}: {
  token: string;
  chain: string;
  limit?: number;
}) {
  const { data, isLoading, error } = useQuery<{
    data: { items?: Holder[] };
  }>({
    queryKey: ["chat-holders", chain, token, limit],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/holders?chain=${chain}&address=${token}&limit=${limit}`,
      );
      if (!r.ok) throw new Error(`holders ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const items = data?.data?.items ?? [];
  return (
    <div className="my-2 rounded-md border bg-secondary/30 p-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Top {limit} holders
        </span>
        <Link
          href={`/token/${chain}/${token}`}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          token lens →
        </Link>
      </div>
      {isLoading && <Skeleton className="h-24" />}
      {error && (
        <p className="text-[10px] text-red-400">
          {(error as Error).message}
        </p>
      )}
      <ul className="text-[11px] font-mono divide-y divide-border/40">
        {items.slice(0, limit).map((h, i) => {
          const wallet = h.owner ?? h.address ?? "";
          return (
            <li
              key={`${wallet}-${i}`}
              className="flex items-center justify-between py-1 gap-2"
            >
              <span className="text-muted-foreground tabular-nums w-4">
                {i + 1}
              </span>
              <Link
                href={`/wallet/${chain}/${wallet}`}
                className="flex-1 truncate hover:text-foreground"
              >
                {shortAddr(wallet, 4, 4)}
              </Link>
              <span className="tabular-nums w-16 text-right">
                {fmtCount(h.ui_amount)}
              </span>
              <span className="tabular-nums w-12 text-right text-muted-foreground">
                {fmtPct(h.percentage)}
              </span>
            </li>
          );
        })}
        {!isLoading && items.length === 0 && (
          <li className="text-[10px] text-muted-foreground py-1">
            No holders.
          </li>
        )}
      </ul>
    </div>
  );
}

export function WalletCardTag({
  address,
  chain,
}: {
  address: string;
  chain: string;
}) {
  const networth = useQuery<{ data: { totalUsd?: number } }>({
    queryKey: ["chat-wallet-nw", chain, address],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/networth?chain=${chain}&wallet=${address}`,
      );
      if (!r.ok) throw new Error(`nw ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });
  const pnl = useQuery<{
    data: {
      realized_pnl?: number;
      unrealized_pnl?: number;
      win_rate?: number;
      trade_count?: number;
    };
  }>({
    queryKey: ["chat-wallet-pnl", chain, address],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/pnl-summary?chain=${chain}&wallet=${address}&type=all`,
      );
      if (!r.ok) throw new Error(`pnl ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const total =
    (num(networth.data?.data?.totalUsd) ?? 0);
  const realized = num(pnl.data?.data?.realized_pnl) ?? 0;
  const unrealized = num(pnl.data?.data?.unrealized_pnl) ?? 0;
  const win = num(pnl.data?.data?.win_rate);
  const trades = num(pnl.data?.data?.trade_count);

  return (
    <Link
      href={`/wallet/${chain}/${address}`}
      className="block my-2 rounded-md border bg-secondary/30 hover:bg-secondary/50 px-3 py-2"
    >
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
        <span>Wallet · {chain}</span>
        <span className="font-mono">{shortAddr(address, 6, 6)}</span>
      </div>
      <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
        <Stat label="Net worth" value={fmtUsd(total)} />
        <Stat
          label="Realized"
          value={fmtUsd(realized)}
          tone={realized >= 0 ? "good" : "bad"}
        />
        <Stat
          label="Unrealized"
          value={fmtUsd(unrealized)}
          tone={unrealized >= 0 ? "good" : "bad"}
        />
        <Stat label="Win" value={fmtPct(win)} sub={`${fmtCount(trades)} trades`} />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded bg-secondary/40 p-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "tabular-nums",
          tone === "good" && "text-emerald-400",
          tone === "bad" && "text-red-400",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}
