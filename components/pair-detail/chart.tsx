"use client";

import {
  createChart,
  CrosshairMode,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useBaseQuotePriceStream,
  usePriceStream,
  type BaseQuotePriceEvent,
  type PriceEvent,
} from "@/lib/ws/hooks";
import { cn } from "@/lib/utils";
import type { PairBundle } from "./load-bundle";

const INTERVALS = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1H", label: "1h" },
  { id: "4H", label: "4h" },
  { id: "1D", label: "1d" },
] as const;
type Interval = (typeof INTERVALS)[number]["id"];

interface ChartResp {
  source: string;
  data: { items?: Record<string, unknown>[] };
}

function extractCandles(resp: ChartResp | undefined): CandlestickData[] {
  if (!resp) return [];
  const items = (resp.data?.items as Record<string, unknown>[]) ?? [];
  return items
    .map((p): CandlestickData | null => {
      const t = Number(p["unixTime"]);
      const o = Number(p["o"]);
      const h = Number(p["h"]);
      const l = Number(p["l"]);
      const c = Number(p["c"]);
      if (![t, o, h, l, c].every(Number.isFinite)) {
        const v = Number(p["value"]);
        if (Number.isFinite(t) && Number.isFinite(v)) {
          return {
            time: t as UTCTimestamp,
            open: v,
            high: v,
            low: v,
            close: v,
          };
        }
        return null;
      }
      return {
        time: t as UTCTimestamp,
        open: o,
        high: h,
        low: l,
        close: c,
      };
    })
    .filter((x): x is CandlestickData => x !== null);
}

export function PairChart({ bundle }: { bundle: PairBundle }) {
  const [interval, setInterval] = useState<Interval>("1m");
  // mode: "usd" → price in quote-token's USD; "quote" → base/quote ratio
  const [mode, setMode] = useState<"usd" | "quote">("usd");

  const baseAddr = bundle.overview?.base?.address;
  const quoteAddr = bundle.overview?.quote?.address;
  const canQuoteMode = !!baseAddr && !!quoteAddr;

  const usdQ = useQuery<ChartResp, Error>({
    queryKey: ["pair-ohlcv", bundle.chain, bundle.address, interval],
    queryFn: async () => {
      const usp = new URLSearchParams({
        chain: bundle.chain,
        address: bundle.address,
        type: interval,
      });
      const r = await fetch(`/api/pair/ohlcv?${usp}`);
      if (!r.ok) throw new Error(`pair-ohlcv ${r.status}`);
      return r.json();
    },
    enabled: mode === "usd",
    staleTime: 30_000,
  });

  const bqQ = useQuery<ChartResp, Error>({
    queryKey: ["pair-ohlcv-bq", bundle.chain, baseAddr, quoteAddr, interval],
    queryFn: async () => {
      const usp = new URLSearchParams({
        chain: bundle.chain,
        base: baseAddr ?? "",
        quote: quoteAddr ?? "",
        type: interval,
      });
      const r = await fetch(`/api/pair/ohlcv-base-quote?${usp}`);
      if (!r.ok) throw new Error(`pair-ohlcv-bq ${r.status}`);
      return r.json();
    },
    enabled: mode === "quote" && canQuoteMode,
    staleTime: 30_000,
  });

  const active = mode === "usd" ? usdQ : bqQ;
  const candles = useMemo(() => extractCandles(active.data), [active.data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<
    ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null
  >(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "rgb(160,163,168)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        rightOffset: 5,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (seriesRef.current) {
      try {
        chart.removeSeries(seriesRef.current);
      } catch {
        /* swallow */
      }
      seriesRef.current = null;
    }
    const series = chart.addCandlestickSeries({
      upColor: "rgb(52,211,153)",
      downColor: "rgb(248,113,113)",
      borderUpColor: "rgb(52,211,153)",
      borderDownColor: "rgb(248,113,113)",
      wickUpColor: "rgb(52,211,153)",
      wickDownColor: "rgb(248,113,113)",
    });
    series.setData(candles);
    seriesRef.current = series;
    chart.timeScale().fitContent();
  }, [candles, mode]);

  // Live updates
  // USD mode: SUBSCRIBE_PRICE on the pair address
  const usdStream = usePriceStream(
    bundle.address,
    bundle.chain,
    interval,
    { enabled: mode === "usd" },
  );
  const bqStream = useBaseQuotePriceStream(
    baseAddr,
    quoteAddr,
    bundle.chain,
    interval,
    { enabled: mode === "quote" && canQuoteMode },
  );

  useEffect(() => {
    const ev = (mode === "usd" ? usdStream.data : bqStream.data) as
      | PriceEvent
      | BaseQuotePriceEvent
      | null;
    const series = seriesRef.current as ISeriesApi<"Candlestick"> | null;
    if (!ev?.data || !series) return;
    const d = ev.data as Record<string, unknown>;
    const t = Number(d["unixTime"] ?? d["time"]);
    const c = Number(d["c"]);
    if (!Number.isFinite(t) || !Number.isFinite(c)) return;
    const o = Number(d["o"]);
    const h = Number(d["h"]);
    const l = Number(d["l"]);
    const candle: CandlestickData = {
      time: t as UTCTimestamp,
      open: Number.isFinite(o) ? o : c,
      high: Number.isFinite(h) ? h : c,
      low: Number.isFinite(l) ? l : c,
      close: c,
    };
    try {
      series.update(candle);
    } catch {
      /* lightweight-charts throws on out-of-order; safe to ignore */
    }
  }, [mode, usdStream.data, bqStream.data]);

  const wsStatus = mode === "usd" ? usdStream.status : bqStream.status;

  return (
    <div className="rounded-md border bg-secondary/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border gap-3 flex-wrap">
        <div className="flex gap-1">
          {INTERVALS.map((i) => (
            <button
              key={i.id}
              onClick={() => setInterval(i.id)}
              className={cn(
                "rounded px-2 py-0.5 text-xs",
                interval === i.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ModeToggle
            mode={mode}
            setMode={setMode}
            quoteSym={bundle.overview?.quote?.symbol}
            disableQuote={!canQuoteMode}
          />
          {active.isFetching && (
            <span className="text-[10px] text-muted-foreground">loading…</span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px]",
              wsStatus === "open" && "text-emerald-400",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                wsStatus === "open"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-muted-foreground/40",
              )}
            />
            ws {wsStatus}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="h-[360px] w-full" />
      {active.error && (
        <div className="px-3 py-2 text-xs text-red-400 border-t border-border">
          {active.error.message}
        </div>
      )}
      {!active.isLoading && candles.length === 0 && (
        <div className="px-3 py-6 text-xs text-muted-foreground text-center">
          No candles for this pair / interval.
        </div>
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  setMode,
  quoteSym,
  disableQuote,
}: {
  mode: "usd" | "quote";
  setMode: (m: "usd" | "quote") => void;
  quoteSym?: string;
  disableQuote: boolean;
}) {
  return (
    <div className="rounded-md border border-border overflow-hidden text-[10px]">
      <button
        className={cn(
          "px-2 py-1",
          mode === "usd" ? "bg-secondary text-foreground" : "text-muted-foreground",
        )}
        onClick={() => setMode("usd")}
      >
        USD
      </button>
      <button
        disabled={disableQuote}
        className={cn(
          "px-2 py-1 disabled:opacity-30",
          mode === "quote"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground",
        )}
        onClick={() => setMode("quote")}
        title={disableQuote ? "Quote token unknown" : ""}
      >
        per {quoteSym ?? "QUOTE"}
      </button>
    </div>
  );
}

