"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { fmtTimeAgo, fmtCount, shortAddr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface CustodyHop {
  wallet: string;
  from: string;
  amount: number;
  blockUnixTime: number;
  txHash: string;
}

interface Resp {
  wallet: string;
  origin: string | null;
  chain: CustodyHop[];
}

export function OriginTab({
  chain,
  wallet,
}: {
  chain: string;
  wallet: string;
}) {
  const fundedBy = useQuery<Resp>({
    queryKey: ["funded-by", chain, wallet],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/funded-by?chain=${chain}&wallet=${wallet}&depth=4`,
      );
      if (!r.ok) throw new Error(`funded-by ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60_000,
  });

  const hops = fundedBy.data?.chain ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-secondary/20 p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Funded by · chain of custody
        </h3>
        {fundedBy.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {fundedBy.error && (
          <p className="text-xs text-red-400">
            {(fundedBy.error as Error).message}
          </p>
        )}
        {!fundedBy.isLoading && hops.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No incoming transfers found — wallet may pre-date Birdeye coverage.
          </p>
        )}
        <ol className="space-y-1">
          {hops.map((hop, i) => (
            <li key={i}>
              <div className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-muted-foreground tabular-nums w-6">
                    #{i + 1}
                  </span>
                  <span className="font-mono truncate">
                    {shortAddr(hop.wallet, 6, 6)}
                  </span>
                  <span className="text-muted-foreground">←</span>
                  <Link
                    href={`/wallet/${chain}/${hop.from}`}
                    className="font-mono truncate hover:text-foreground"
                  >
                    {shortAddr(hop.from, 6, 6)}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                  <span>{fmtCount(hop.amount)}</span>
                  <span>{fmtTimeAgo(hop.blockUnixTime)} ago</span>
                </div>
              </div>
              {i < hops.length - 1 && (
                <div className="flex justify-center my-1 text-muted-foreground/60">
                  <ArrowDown className="h-3 w-3" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
