"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fmtCount, fmtPct, shortAddr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { HolderDrawer } from "./holder-drawer";

interface Holder {
  owner?: string;
  address?: string;
  amount?: number | string;
  ui_amount?: number;
  percentage?: number;
}

export function HoldersPanel({
  chain,
  address,
}: {
  chain: string;
  address: string;
}) {
  const [page, setPage] = useState(0);
  const [openWallet, setOpenWallet] = useState<string | null>(null);

  const list = useQuery<{ data: { items?: Holder[]; total?: number } }>({
    queryKey: ["holders", chain, address, page],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/holders?chain=${chain}&address=${address}&offset=${page * 50}&limit=50`,
      );
      if (!r.ok) throw new Error(`holders ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const dist = useQuery<{ data: { distribution?: unknown[]; holder_count?: number } }>({
    queryKey: ["holder-dist", chain, address],
    queryFn: async () => {
      const r = await fetch(
        `/api/token/holder-distribution?chain=${chain}&address=${address}`,
      );
      if (!r.ok) throw new Error(`distribution ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60_000,
  });

  const holders = list.data?.data?.items ?? [];

  return (
    <div className="rounded-md border bg-secondary/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Top holders
        </h3>
        <div className="text-[10px] text-muted-foreground">
          {dist.data?.data?.holder_count != null && (
            <>holders: {fmtCount(dist.data.data.holder_count)}</>
          )}
        </div>
      </div>

      <DistributionBar dist={dist.data?.data?.distribution} />

      {list.isLoading && <SkeletonRows />}
      {list.error && (
        <p className="text-xs text-red-400">{(list.error as Error).message}</p>
      )}
      <ul className="divide-y divide-border/50 mt-3">
        {holders.map((h, i) => {
          const wallet = h.owner ?? h.address ?? "";
          return (
            <li key={`${wallet}-${i}`}>
              <button
                onClick={() => wallet && setOpenWallet(wallet)}
                className="w-full flex items-center justify-between gap-3 py-2 text-xs text-left hover:bg-secondary/40 px-2 rounded"
              >
                <span className="text-muted-foreground tabular-nums w-6">
                  {page * 50 + i + 1}
                </span>
                <span className="font-mono flex-1 truncate">
                  {shortAddr(wallet, 6, 6)}
                </span>
                <span className="tabular-nums w-24 text-right">
                  {fmtCount(h.ui_amount)}
                </span>
                <span className="tabular-nums w-16 text-right text-muted-foreground">
                  {fmtPct(h.percentage)}
                </span>
              </button>
            </li>
          );
        })}
        {!list.isLoading && holders.length === 0 && (
          <li className="text-xs text-muted-foreground py-3">No holders.</li>
        )}
      </ul>

      <div className="flex justify-between items-center mt-3 text-xs">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          ← prev
        </button>
        <span className="text-muted-foreground tabular-nums">
          page {page + 1}
        </span>
        <button
          disabled={holders.length < 50}
          onClick={() => setPage((p) => p + 1)}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          next →
        </button>
      </div>

      {openWallet && (
        <HolderDrawer
          chain={chain}
          wallet={openWallet}
          onClose={() => setOpenWallet(null)}
        />
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1.5 mt-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-6" />
      ))}
    </div>
  );
}

function DistributionBar({ dist }: { dist?: unknown[] }) {
  if (!Array.isArray(dist) || dist.length === 0) return null;
  // Best-effort parse: array of { range, count, value, percentage }
  const buckets = dist
    .map((d) => {
      const r = d as Record<string, unknown>;
      const p = Number(r["percentage"] ?? r["value"] ?? 0);
      const label = String(r["range"] ?? r["bucket"] ?? r["label"] ?? "");
      return { label, p: Number.isFinite(p) ? p : 0 };
    })
    .filter((b) => b.p >= 0);
  const total = buckets.reduce((n, b) => n + b.p, 0) || 1;
  const palette = [
    "bg-emerald-500",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-orange-400",
    "bg-red-400",
    "bg-red-500",
  ];
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        {buckets.map((b, i) => (
          <div
            key={i}
            className={palette[i % palette.length]}
            style={{ width: `${(b.p / total) * 100}%` }}
            title={`${b.label} · ${fmtPct(b.p)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
        {buckets.map((b, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-sm ${palette[i % palette.length]}`}
            />
            {b.label} {fmtPct(b.p)}
          </span>
        ))}
      </div>
    </div>
  );
}

