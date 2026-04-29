/** Number / address / time formatters shared across the UI. */

export function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function fmtUsd(v?: number, opts: { precise?: boolean } = {}): string {
  if (v == null) return "—";
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}t`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}b`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}m`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}k`;
  if (abs >= 1) return `${sign}$${abs.toFixed(opts.precise ? 4 : 2)}`;
  if (abs > 0) return `${sign}$${abs.toPrecision(opts.precise ? 5 : 3)}`;
  return "$0";
}

export function fmtPct(v?: number, opts: { decimals?: number } = {}): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const d = opts.decimals ?? 2;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(d)}%`;
}

export function fmtCount(v?: number): string {
  if (v == null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}b`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}m`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toLocaleString();
}

export function shortAddr(addr?: string, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function fmtTimeAgo(unixSec?: number): string {
  if (!unixSec) return "—";
  const ms =
    unixSec > 1e12 ? Date.now() - unixSec : Date.now() - unixSec * 1000;
  if (ms < 0) return "now";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86_400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86_400)}d`;
}
