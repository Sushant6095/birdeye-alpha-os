"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCount, fmtPct, fmtUsd, num, shortAddr } from "@/lib/format";
import { useChain } from "@/components/providers/chain-provider";
import { Radar, COLORS } from "./radar";
import { CorrelationMatrix } from "./correlation-matrix";
import { cn } from "@/lib/utils";

interface TokenRow {
  address: string;
  overview: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  market: Record<string, unknown> | null;
  trade: Record<string, unknown> | null;
  allTime: Record<string, unknown> | null;
  windows: Record<string, Record<string, unknown> | null>;
}

interface TokensResp {
  rows: TokenRow[];
  priceMap: Record<string, { value?: number; liquidity?: number } | null>;
}

interface OverlapResp {
  overlap: Array<{ wallet: string; count: number; tokens: string[] }>;
}

interface WalletRow {
  wallet: string;
  networth: { totalUsd?: number } | null;
  pnl: Record<string, unknown> | null;
}

const WIN: Array<"1h" | "4h" | "8h" | "24h"> = ["1h", "4h", "8h", "24h"];

export function ComparePage() {
  const { chain } = useChain();
  const [mode, setMode] = useState<"tokens" | "wallets">("tokens");
  const [text, setText] = useState("");

  const addresses = useMemo(
    () =>
      text
        .split(/[\s,]+/)
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 10),
    [text],
  );

  const tokens = useMutation<TokensResp, Error>({
    mutationFn: async () => {
      const r = await fetch(`/api/compare/tokens?chain=${chain}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addresses }),
      });
      if (!r.ok) throw new Error(`tokens ${r.status}`);
      return r.json();
    },
  });
  const overlap = useMutation<OverlapResp, Error>({
    mutationFn: async () => {
      const r = await fetch(`/api/compare/holder-overlap?chain=${chain}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addresses }),
      });
      if (!r.ok) throw new Error(`overlap ${r.status}`);
      return r.json();
    },
  });
  const tradersOverlap = useMutation<OverlapResp, Error>({
    mutationFn: async () => {
      const r = await fetch(
        `/api/compare/top-trader-overlap?chain=${chain}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ addresses }),
        },
      );
      if (!r.ok) throw new Error(`traders ${r.status}`);
      return r.json();
    },
  });

  const wallets = useMutation<{ rows: WalletRow[] }, Error>({
    mutationFn: async () => {
      const r = await fetch(`/api/compare/wallets?chain=${chain}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallets: addresses }),
      });
      if (!r.ok) throw new Error(`wallets ${r.status}`);
      return r.json();
    },
  });

  function go() {
    if (addresses.length === 0) return;
    if (mode === "tokens") {
      tokens.mutate();
      if (addresses.length >= 2) {
        overlap.mutate();
        tradersOverlap.mutate();
      }
    } else {
      wallets.mutate();
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
          <p className="text-sm text-muted-foreground">
            Up to 10 token or wallet addresses. Detects holder overlap and
            top-trader overlap when ≥ 2 tokens supplied.
          </p>
        </div>
        <div className="rounded-md border border-border overflow-hidden text-xs">
          <button
            className={cn(
              "px-3 h-8",
              mode === "tokens"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => setMode("tokens")}
          >
            Tokens
          </button>
          <button
            className={cn(
              "px-3 h-8",
              mode === "wallets"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => setMode("wallets")}
          >
            Wallets
          </button>
        </div>
      </header>

      <div className="rounded-md border bg-secondary/20 p-3 space-y-2">
        <textarea
          rows={3}
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm font-mono"
          placeholder={
            mode === "tokens"
              ? "Paste up to 10 token addresses, separated by commas, spaces, or newlines"
              : "Paste up to 10 wallet addresses"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {addresses.length}/10 · chain {chain}
          </span>
          <Button
            onClick={go}
            disabled={addresses.length === 0}
            size="sm"
          >
            Compare
          </Button>
        </div>
      </div>

      {mode === "tokens" && (
        <TokenView
          chain={chain}
          tokens={tokens}
          overlap={overlap}
          tradersOverlap={tradersOverlap}
        />
      )}
      {mode === "wallets" && <WalletView chain={chain} wallets={wallets} />}
    </div>
  );
}

/* -------------------- Token view -------------------- */

function TokenView({
  chain,
  tokens,
  overlap,
  tradersOverlap,
}: {
  chain: string;
  tokens: ReturnType<typeof useMutation<TokensResp, Error>>;
  overlap: ReturnType<typeof useMutation<OverlapResp, Error>>;
  tradersOverlap: ReturnType<typeof useMutation<OverlapResp, Error>>;
}) {
  const rows = tokens.data?.rows ?? [];
  if (tokens.isPending)
    return (
      <div className="space-y-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-72" />
      </div>
    );
  if (tokens.error)
    return (
      <p className="text-xs text-red-400">{tokens.error.message}</p>
    );
  if (rows.length === 0) return null;

  return (
    <>
      <RadarSection rows={rows} />
      {rows.length >= 3 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            Correlation matrix · price-change windows
          </h2>
          <CorrelationMatrix
            series={rows.map((r) => ({
              label:
                String(
                  (r.meta as { symbol?: string } | null)?.symbol ??
                    r.address.slice(0, 6),
                ),
              values: WIN.map(
                (w) => num((r.windows[w] as { priceChangePercent?: number } | null)?.priceChangePercent) ?? 0,
              ),
            }))}
          />
        </section>
      )}

      <Section title="Metric matrix">
        <div className="overflow-auto rounded-md border bg-secondary/20">
          <table className="text-xs w-full">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <Th>Token</Th>
                <Th right>Price</Th>
                <Th right>MCap</Th>
                <Th right>FDV</Th>
                <Th right>Liquidity</Th>
                <Th right>24h vol</Th>
                <Th right>24h Δ%</Th>
                <Th right>Holders</Th>
                <Th right>Trades (all-time)</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const overview = r.overview as Record<string, unknown> | null;
                const market = r.market as Record<string, unknown> | null;
                const trade = r.trade as Record<string, unknown> | null;
                const allTime = r.allTime as Record<string, unknown> | null;
                const sym =
                  ((r.meta as { symbol?: string } | null)?.symbol ??
                    (overview?.["symbol"] as string | undefined)) ??
                  shortAddr(r.address, 4, 4);
                const change =
                  num(overview?.["priceChange24hPercent"]) ??
                  num(trade?.["price_change_24h_percent"]);
                return (
                  <tr
                    key={r.address}
                    className="border-b border-border/30 hover:bg-secondary/40"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/token/${chain}/${r.address}`}
                        className="inline-flex items-center gap-2 hover:text-foreground"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="font-medium">{sym}</span>
                        <span className="font-mono text-muted-foreground">
                          {shortAddr(r.address, 4, 4)}
                        </span>
                      </Link>
                    </td>
                    <Td right>{fmtUsd(num(overview?.["price"]), { precise: true })}</Td>
                    <Td right>
                      {fmtUsd(
                        num(market?.["marketcap"]) ??
                          num(market?.["circulating_marketcap"]) ??
                          num(overview?.["mc"]),
                      )}
                    </Td>
                    <Td right>
                      {fmtUsd(num(market?.["fdv"]) ?? num(market?.["marketcap"]))}
                    </Td>
                    <Td right>{fmtUsd(num(market?.["liquidity"]))}</Td>
                    <Td right>{fmtUsd(num(trade?.["volume_24h_usd"]))}</Td>
                    <Td
                      right
                      className={cn(
                        (change ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {fmtPct(change)}
                    </Td>
                    <Td right>{fmtCount(num(overview?.["holder"]))}</Td>
                    <Td right>{fmtCount(num(allTime?.["total_trades"]))}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Holder overlap">
        {overlap.isPending && <Skeleton className="h-24" />}
        {overlap.error && (
          <p className="text-xs text-red-400">{overlap.error.message}</p>
        )}
        {overlap.data && (
          <OverlapTable
            entries={overlap.data.overlap}
            chain={chain}
            tokens={rows}
            label="Wallet"
          />
        )}
      </Section>

      <Section title="Top-trader overlap (24h)">
        {tradersOverlap.isPending && <Skeleton className="h-24" />}
        {tradersOverlap.error && (
          <p className="text-xs text-red-400">
            {tradersOverlap.error.message}
          </p>
        )}
        {tradersOverlap.data && (
          <OverlapTable
            entries={tradersOverlap.data.overlap}
            chain={chain}
            tokens={rows}
            label="Trader"
          />
        )}
      </Section>
    </>
  );
}

function RadarSection({ rows }: { rows: TokenRow[] }) {
  const sigs: { label: string; values: number[] }[] = [
    { label: "Price 24h Δ", values: [] },
    { label: "Liquidity", values: [] },
    { label: "MCap", values: [] },
    { label: "24h vol", values: [] },
    { label: "Holders", values: [] },
    { label: "Lifetime trades", values: [] },
  ];

  for (const r of rows) {
    const change =
      num((r.overview as Record<string, unknown> | null)?.["priceChange24hPercent"]) ?? 0;
    sigs[0]!.values.push((change + 100) / 200); // -100..+100 → 0..1
    sigs[1]!.values.push(
      logScale(num((r.market as Record<string, unknown> | null)?.["liquidity"])),
    );
    sigs[2]!.values.push(
      logScale(num((r.market as Record<string, unknown> | null)?.["marketcap"])),
    );
    sigs[3]!.values.push(
      logScale(num((r.trade as Record<string, unknown> | null)?.["volume_24h_usd"])),
    );
    sigs[4]!.values.push(
      logScale(num((r.overview as Record<string, unknown> | null)?.["holder"]), 6),
    );
    sigs[5]!.values.push(
      logScale(num((r.allTime as Record<string, unknown> | null)?.["total_trades"]), 7),
    );
  }

  return (
    <Section title="Radar overview">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start">
        <Radar
          axes={sigs}
          series={rows.map((r) => r.address)}
        />
        <ul className="text-xs space-y-1 font-mono">
          {rows.map((r, i) => {
            const sym =
              ((r.meta as { symbol?: string } | null)?.symbol ??
                (r.overview as { symbol?: string } | null)?.symbol) ??
              shortAddr(r.address, 4, 4);
            return (
              <li
                key={r.address}
                className="flex items-center gap-2"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium">{sym}</span>
                <span className="text-muted-foreground">
                  {shortAddr(r.address, 4, 4)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

function logScale(v: number | undefined, max = 9): number {
  if (!v || v <= 0) return 0;
  const log = Math.log10(v);
  return Math.max(0, Math.min(1, log / max));
}

function OverlapTable({
  entries,
  chain,
  tokens,
  label,
}: {
  entries: Array<{ wallet: string; count: number; tokens: string[] }>;
  chain: string;
  tokens: TokenRow[];
  label: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No overlap detected — these tokens have largely disjoint holder sets.
      </p>
    );
  }
  const symFor = (addr: string) => {
    const r = tokens.find(
      (t) => t.address.toLowerCase() === addr.toLowerCase(),
    );
    return (
      ((r?.meta as { symbol?: string } | null)?.symbol ??
        (r?.overview as { symbol?: string } | null)?.symbol) ??
      shortAddr(addr, 4, 4)
    );
  };
  return (
    <div className="rounded-md border bg-secondary/20 overflow-auto">
      <table className="text-xs w-full">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border/50">
            <Th>{label}</Th>
            <Th right>In # tokens</Th>
            <Th>Tokens</Th>
          </tr>
        </thead>
        <tbody>
          {entries.slice(0, 30).map((e, i) => (
            <tr
              key={`${e.wallet}-${i}`}
              className="border-b border-border/30 hover:bg-secondary/40"
            >
              <td className="px-3 py-2 font-mono">
                <Link
                  href={`/wallet/${chain}/${e.wallet}`}
                  className="hover:text-foreground"
                >
                  {shortAddr(e.wallet, 6, 6)}
                </Link>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{e.count}</td>
              <td className="px-3 py-2 truncate">
                {e.tokens.map((t) => symFor(t)).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- Wallet view -------------------- */

function WalletView({
  chain,
  wallets,
}: {
  chain: string;
  wallets: ReturnType<typeof useMutation<{ rows: WalletRow[] }, Error>>;
}) {
  if (wallets.isPending) return <Skeleton className="h-72" />;
  if (wallets.error)
    return <p className="text-xs text-red-400">{wallets.error.message}</p>;
  const rows = wallets.data?.rows ?? [];
  if (rows.length === 0) return null;
  return (
    <Section title="Wallet PnL matrix">
      <div className="overflow-auto rounded-md border bg-secondary/20">
        <table className="text-xs w-full">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <Th>Wallet</Th>
              <Th right>Net worth</Th>
              <Th right>Realized</Th>
              <Th right>Unrealized</Th>
              <Th right>Trades</Th>
              <Th right>Win rate</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const realized = num(
                (r.pnl as { realized_pnl?: number } | null)?.realized_pnl,
              );
              const unrealized = num(
                (r.pnl as { unrealized_pnl?: number } | null)?.unrealized_pnl,
              );
              const trades = num(
                (r.pnl as { trade_count?: number } | null)?.trade_count,
              );
              const win = num(
                (r.pnl as { win_rate?: number } | null)?.win_rate,
              );
              return (
                <tr
                  key={r.wallet}
                  className="border-b border-border/30 hover:bg-secondary/40"
                >
                  <td className="px-3 py-2 font-mono">
                    <Link
                      href={`/wallet/${chain}/${r.wallet}`}
                      className="hover:text-foreground"
                    >
                      {shortAddr(r.wallet, 6, 6)}
                    </Link>
                  </td>
                  <Td right>{fmtUsd(num(r.networth?.totalUsd))}</Td>
                  <Td
                    right
                    className={cn(
                      (realized ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {fmtUsd(realized)}
                  </Td>
                  <Td
                    right
                    className={cn(
                      (unrealized ?? 0) >= 0
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {fmtUsd(unrealized)}
                  </Td>
                  <Td right>{fmtCount(trades)}</Td>
                  <Td right>{fmtPct(win)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* helpers */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Th({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={cn(
        "font-normal px-3 py-2",
        right ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2 tabular-nums",
        right ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}
