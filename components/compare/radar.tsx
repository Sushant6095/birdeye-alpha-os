"use client";

interface Axis {
  label: string;
  values: number[]; // one per series, all on the same 0..1 scale
}

interface RadarProps {
  axes: Axis[];
  series: string[];
  size?: number;
}

const COLORS = [
  "rgb(52,211,153)",
  "rgb(248,113,113)",
  "rgb(251,191,36)",
  "rgb(96,165,250)",
  "rgb(167,139,250)",
  "rgb(244,114,182)",
  "rgb(45,212,191)",
  "rgb(252,165,165)",
];

/** Tiny SVG radar chart so we don't ship another dep. */
export function Radar({ axes, series, size = 280 }: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28;
  const n = axes.length;
  if (n < 3) {
    return (
      <p className="text-xs text-muted-foreground">
        Need at least 3 axes for a radar chart.
      </p>
    );
  }
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, v: number) => {
    const r = radius * Math.max(0, Math.min(1, v));
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
    >
      {rings.map((r, i) => (
        <polygon
          key={i}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          points={axes
            .map((_, idx) => {
              const [x, y] = point(idx, r);
              return `${x},${y}`;
            })
            .join(" ")}
        />
      ))}
      {axes.map((_, idx) => {
        const [x, y] = point(idx, 1);
        return (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}
      {series.map((_, sIdx) => {
        const color = COLORS[sIdx % COLORS.length];
        const points = axes
          .map((a, axisIdx) => {
            const v = a.values[sIdx] ?? 0;
            const [x, y] = point(axisIdx, v);
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <g key={sIdx}>
            <polygon
              points={points}
              fill={color ?? "white"}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={1.5}
            />
          </g>
        );
      })}
      {axes.map((a, idx) => {
        const [x, y] = point(idx, 1.12);
        return (
          <text
            key={idx}
            x={x}
            y={y}
            fill="rgb(160,163,168)"
            fontSize={10}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

export { COLORS };
