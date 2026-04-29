"use client";

import { useMemeStatsStream } from "@/lib/ws/hooks";
import { Rocket } from "lucide-react";

export function MemePanel({
  chain,
  address,
}: {
  chain: string;
  /** Address kept for symmetry — meme stats stream is global per chain. */
  address: string;
}) {
  const stream = useMemeStatsStream(chain);
  const last = stream.data?.data ?? null;
  return (
    <div className="rounded-md border bg-emerald-500/5 border-emerald-500/20 p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300">
        <Rocket className="h-3.5 w-3.5" />
        Meme stats — chain-wide
        <span className="text-[10px] text-muted-foreground">
          ({address.slice(0, 6)}…)
        </span>
      </div>
      {last ? (
        <pre className="text-[11px] font-mono text-muted-foreground/90 max-h-48 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(last, null, 2)}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">
          Waiting for meme stats tick… ({stream.status})
        </p>
      )}
    </div>
  );
}
