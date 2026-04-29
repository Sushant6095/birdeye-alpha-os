"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { fmtCount, fmtPct, fmtUsd, num, shortAddr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Row {
  address?: string;
  symbol?: string;
  realized_pnl?: number;
  unrealized_pnl?: number;
  total_pnl?: number;
  win_rate?: number;
  trade_count?: number;
  volume?: number;
  [k: string]: unknown;
}

const SORTS = [
  { id: "realized_pnl", label: "Realized" },
  { id: "unrealized_pnl", label: "Unrealized" },
  { id: "win_rate", label: "Win rate" },
  { id: "trade_count", label: "Trades" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

export function PnLTab({ chain, wallet }: { chain: string; wallet: string }) {
  const [sortBy, setSortBy] = useState<SortId>("realized_pnl");
  const [sortType, setSortType] = useState<"asc" | "desc">("desc");
  const [openToken, setOpenToken] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: { items?: Row[] } }>({
    queryKey: ["pnl-detail", chain, wallet, sortBy, sortType],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/pnl-detail?chain=${chain}&wallet=${wallet}&sortBy=${sortBy}&sortType=${sortType}`,
      );
      if (!r.ok) throw new Error(`pnl-detail ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const rows = data?.data?.items ?? [];

  function toggleSort(id: SortId) {
    if (id === sortBy) {
      setSortType((t) => (t === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(id);
      setSortType("desc");
    }
  }

  return (
    <div className="rounded-md border bg-secondary/20">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Per-token PnL
        </h3>
      </header>
      {isLoading && (
        <div className="p-4 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7" />
          ))}
        </div>
      )}
      {error && (
        <p className="px-4 py-2 text-xs text-red-400">
          {(error as Error).message}
        </p>
      )}
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border/50">
            <th className="text-left font-normal px-4 py-2">Token</th>
            {SORTS.map((s) => (
              <th
                key={s.id}
                className="text-right font-normal px-4 py-2 cursor-pointer select-none"
                onClick={() => toggleSort(s.id)}
              >
                <span className="inline-flex items-center gap-1">
                  {s.label}
                  {sortBy === s.id &&
                    (sortType === "desc" ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUp className="h-3 w-3" />
                    ))}
                </span>
              </th>
            ))}
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const realized = num(row.realized_pnl);
            const unrealized = num(row.unrealized_pnl);
            const isOpen = openToken === row.address;
            return (
              <tr key={`${row.address}-${i}`} className="border-b border-border/30">
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      setOpenToken(isOpen ? null : row.address ?? null)
                    }
                    className="inline-flex items-center gap-2 hover:text-foreground text-left"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isOpen && "rotate-90",
                      )}
                    />
                    <span className="font-medium">{row.symbol ?? "—"}</span>
                    <span className="font-mono text-muted-foreground">
                      {shortAddr(row.address, 4, 4)}
                    </span>
                  </button>
                </td>
                <Cell value={realized} signed />
                <Cell value={unrealized} signed />
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtPct(num(row.win_rate))}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtCount(num(row.trade_count))}
                </td>
                <td className="text-right pr-3">
                  <Link
                    href={`/token/${chain}/${row.address ?? ""}`}
                    className="text-muted-foreground hover:text-foreground text-[10px]"
                    title="open token lens"
                  >
                    →
                  </Link>
                </td>
              </tr>
            );
          })}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-6 text-center text-muted-foreground"
              >
                No PnL data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {openToken && (
        <PnLDrillDown
          chain={chain}
          wallet={wallet}
          token={openToken}
          row={rows.find((r) => r.address === openToken)}
        />
      )}
    </div>
  );
}

function Cell({
  value,
  signed,
}: {
  value: number | undefined;
  signed?: boolean;
}) {
  if (value == null) return <td className="px-4 py-2 text-right">—</td>;
  return (
    <td
      className={cn(
        "px-4 py-2 text-right tabular-nums",
        signed && (value >= 0 ? "text-emerald-400" : "text-red-400"),
      )}
    >
      {fmtUsd(value)}
    </td>
  );
}

function PnLDrillDown({
  chain,
  wallet,
  token,
  row,
}: {
  chain: string;
  wallet: string;
  token: string;
  row?: Row;
}) {
  const realized = num(row?.realized_pnl);
  const unrealized = num(row?.unrealized_pnl);
  const total = (realized ?? 0) + (unrealized ?? 0);
  return (
    <div className="border-t border-border bg-secondary/40 px-4 py-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-muted-foreground uppercase tracking-wider text-[10px]">
          {row?.symbol ?? "—"} drill-down
        </h4>
        <Link
          href={`/token/${chain}/${token}`}
          className="text-muted-foreground hover:text-foreground"
        >
          token lens →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Realized" value={fmtUsd(realized)} signed={realized} />
        <Stat
          label="Unrealized"
          value={fmtUsd(unrealized)}
          signed={unrealized}
        />
        <Stat label="Total" value={fmtUsd(total)} signed={total} />
        <Stat label="Volume" value={fmtUsd(num(row?.volume))} />
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Wallet: {shortAddr(wallet, 4, 4)} · Token: {shortAddr(token, 4, 4)}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  signed,
}: {
  label: string;
  value: string;
  signed?: number | undefined;
}) {
  return (
    <div className="rounded bg-secondary/40 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-sm tabular-nums",
          signed != null &&
            (signed >= 0 ? "text-emerald-400" : "text-red-400"),
        )}
      >
        {value}
      </div>
    </div>
  );
}
