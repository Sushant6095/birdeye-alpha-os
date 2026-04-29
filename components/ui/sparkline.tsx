import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Forced color override; otherwise green when last >= first, red otherwise. */
  color?: string;
}

export function Sparkline({
  values,
  width = 80,
  height = 28,
  className,
  color,
}: SparklineProps) {
  if (!values || values.length < 2) {
    return (
      <div
        className={cn("text-muted-foreground/40 text-[10px]", className)}
        style={{ width, height, lineHeight: `${height}px`, textAlign: "center" }}
      >
        —
      </div>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const stroke = color ?? (last >= first ? "rgb(52 211 153)" : "rgb(248 113 113)");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
