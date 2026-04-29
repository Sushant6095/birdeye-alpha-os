import { fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Health = "healthy" | "cautious" | "risky" | "unknown";

function classify(liq?: number): Health {
  if (liq == null) return "unknown";
  if (liq >= 1_000_000) return "healthy";
  if (liq >= 100_000) return "cautious";
  return "risky";
}

const COLORS: Record<Health, string> = {
  healthy: "bg-emerald-500",
  cautious: "bg-amber-400",
  risky: "bg-red-500",
  unknown: "bg-secondary",
};

const LABELS: Record<Health, string> = {
  healthy: "Healthy",
  cautious: "Cautious",
  risky: "Risky",
  unknown: "—",
};

export function LiquidityGauge({ liquidity }: { liquidity?: number }) {
  const h = classify(liquidity);
  // Scale: log so small pools still register on the bar.
  let pct = 0;
  if (liquidity && liquidity > 0) {
    const t = Math.log10(liquidity); // 0..7 over $1 → $10M
    pct = Math.min(100, Math.max(2, (t / 7) * 100));
  }
  return (
    <div className="rounded-md border bg-secondary/20 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground uppercase tracking-wider">
          Liquidity
        </span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider",
            h === "healthy" && "text-emerald-400",
            h === "cautious" && "text-amber-400",
            h === "risky" && "text-red-400",
          )}
        >
          {LABELS[h]}
        </span>
      </div>
      <div className="mt-2 text-lg font-medium tabular-nums">
        {fmtUsd(liquidity)}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full transition-all", COLORS[h])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
