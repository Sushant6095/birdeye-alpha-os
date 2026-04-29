"use client";

import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/format";

interface Props {
  /** array of (label, vector). Pearson correlation computed pairwise. */
  series: { label: string; values: number[] }[];
}

/**
 * Correlation matrix over numeric vectors. We feed it the per-window % change
 * row (1h/4h/8h/24h) for each compared token — different windows are fine
 * approximations for "shape of recent moves" and tend to track each other
 * well for related tokens.
 */
export function CorrelationMatrix({ series }: Props) {
  if (series.length < 3) {
    return (
      <p className="text-xs text-muted-foreground">
        Need ≥ 3 series for a correlation matrix.
      </p>
    );
  }
  const n = series.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(pearson(series[i]!.values, series[j]!.values));
    }
    matrix.push(row);
  }

  return (
    <div className="rounded-md border bg-secondary/20 p-3 overflow-auto">
      <table className="text-[10px] tabular-nums font-mono">
        <thead>
          <tr>
            <th />
            {series.map((s, i) => (
              <th
                key={i}
                className="text-muted-foreground px-1 text-left"
                title={s.label}
              >
                {s.label.slice(0, 6)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th
                className="text-muted-foreground pr-2 text-left"
                title={series[i]?.label}
              >
                {series[i]?.label.slice(0, 6)}
              </th>
              {row.map((v, j) => (
                <td key={j} className="px-1">
                  <span
                    className={cn(
                      "inline-block min-w-[36px] text-center rounded",
                      i === j
                        ? "text-muted-foreground"
                        : v >= 0.6
                          ? "bg-emerald-500/30 text-emerald-200"
                          : v >= 0.2
                            ? "bg-emerald-500/10 text-emerald-300"
                            : v <= -0.6
                              ? "bg-red-500/30 text-red-200"
                              : v <= -0.2
                                ? "bg-red-500/10 text-red-300"
                                : "text-muted-foreground",
                    )}
                  >
                    {i === j ? "—" : fmtPct(v * 100, { decimals: 0 })}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i]!;
    sumB += b[i]!;
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    num += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  const denom = Math.sqrt(denomA * denomB);
  if (denom === 0) return 0;
  return num / denom;
}
