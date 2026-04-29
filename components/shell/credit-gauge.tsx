"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const FREE_TIER_BUDGET = 30_000;

export function CreditGauge() {
  const { data } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const r = await fetch("/api/credits");
      return (await r.json()) as {
        usedToday: number;
        creditsLeft: number | null;
      };
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const used = data?.usedToday ?? 0;
  const left = data?.creditsLeft ?? null;
  const total = left != null ? used + left : FREE_TIER_BUDGET;
  const pct = Math.min(100, Math.max(0, (used / Math.max(1, total)) * 100));

  const tone =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
        ? "bg-amber-400"
        : "bg-emerald-400";

  return (
    <div
      className="hidden sm:flex items-center gap-2 h-9 px-2.5 rounded-md border border-border bg-secondary/40"
      title={
        left != null
          ? `${used.toLocaleString()} used today · ${left.toLocaleString()} left`
          : `${used.toLocaleString()} used today`
      }
    >
      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {used >= 1000 ? `${(used / 1000).toFixed(1)}k` : used}
      </span>
    </div>
  );
}
