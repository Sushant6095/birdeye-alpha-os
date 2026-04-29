"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtCount, fmtUsd, num, shortAddr } from "@/lib/format";

export function SideBalanceWidget({
  chain,
  wallet,
}: {
  chain: string;
  wallet: string;
}) {
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data, isFetching, error } = useQuery<{
    data: { uiAmount?: number; valueUsd?: number; symbol?: string };
  }>({
    queryKey: ["check-balance", chain, wallet, submitted],
    queryFn: async () => {
      if (!submitted) return { data: {} };
      const r = await fetch(
        `/api/wallet/balance?chain=${chain}&wallet=${wallet}&token=${submitted}`,
      );
      if (!r.ok) throw new Error(`balance ${r.status}`);
      return r.json();
    },
    enabled: !!submitted,
    staleTime: 30_000,
  });

  return (
    <aside className="rounded-md border bg-secondary/20 p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
        Check exposure
      </h3>
      <p className="text-[11px] text-muted-foreground">
        Single-token balance lookup. Paste any token address to see what this
        wallet holds.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(token.trim() || null);
        }}
        className="flex gap-2"
      >
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="token address"
          className="font-mono text-xs"
        />
        <Button
          type="submit"
          variant="secondary"
          size="icon"
          disabled={!token.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {isFetching && submitted && <Skeleton className="h-12" />}
      {error && (
        <p className="text-xs text-red-400">{(error as Error).message}</p>
      )}
      {!isFetching && data?.data && submitted && (
        <div className="rounded bg-secondary/40 p-3 text-xs">
          <div className="text-muted-foreground">
            {data.data.symbol ?? shortAddr(submitted, 4, 4)}
          </div>
          <div className="text-base tabular-nums">
            {fmtCount(num(data.data.uiAmount))}
          </div>
          <div className="text-muted-foreground tabular-nums">
            {fmtUsd(num(data.data.valueUsd))}
          </div>
        </div>
      )}
    </aside>
  );
}
