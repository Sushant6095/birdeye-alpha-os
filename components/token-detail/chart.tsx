"use client";

import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type UTCTimestamp,
  CrosshairMode,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePriceStream, type PriceEvent } from "@/lib/ws/hooks";
import { cn } from "@/lib/utils";

const INTERVALS = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1H", label: "1h" },
  { id: "4H", label: "4h" },
  { id: "1D", label: "1d" },
] as const;

type Interval = (typeof INTERVALS)[number]["id"];

interface OhlcvResponse {
  source: "ohlcv_v3" | "history_price";
  data: unknown;
}

function extractCandles(resp: OhlcvResponse | undefined): CandlestickData[] {
  if (!resp) return [];
  const items =
    ((resp.data as { items?: unknown[] })?.items as Record<string, unknown>[]) ??
    [];
  if (resp.source === "history_price") {
    // line points only — fake candles where o=h=l=c=value
    return items
      .map((p): CandlestickData | null => {
        const t = Number(p["unixTime"]);
        const v = Number(p["value"]);
        if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
        return {
          time: t as UTCTimestamp,
          open: v,
          high: v,
          low: v,
          close: v,
        };
      })
      .filter((x): x is CandlestickData => x !== null);
  }
  return items
    .map((p): CandlestickData | null => {
      const t = Number(p["unixTime"]);
      const o = Number(p["o"]);
      const h = Number(p["h"]);
      const l = Number(p["l"]);
      const c = Number(p["c"]);
      if (![t, o, h, l, c].every(Number.isFinite)) return null;
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

export function TokenChart({
  chain,
  address,
}: {
  chain: string;
  address: string;
}) {
  const [interval, setInterval] = useState<Interval>("1m");

  const ohlcv = useQuery<OhlcvResponse, Error>({
    queryKey: ["ohlcv", chain, address, interval],
    queryFn: async () => {
      const usp = new URLSearchParams({ chain, address, type: interval });
      const r = await fetch(`/api/token/ohlcv?${usp}`);
      if (!r.ok) throw new Error(`OHLCV ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const candles = useMemo(() => extractCandles(ohlcv.data), [ohlcv.data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(
    null,
  );
  const lastCandleRef = useRef<CandlestickData | null>(null);

  // mount chart
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "rgb(160, 163, 168)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
      },
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
      lastCandleRef.current = null;
    };
  }, []);

  // (re)create the series when source/interval changes
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
    if (ohlcv.data?.source === "history_price") {
      const series = chart.addLineSeries({
        color: "rgb(52,211,153)",
        lineWidth: 2,
        priceLineVisible: false,
      });
      const lineData: LineData[] = candles.map((c) => ({
        time: c.time,
        value: c.close,
      }));
      series.setData(lineData);
      seriesRef.current = series;
    } else {
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
      lastCandleRef.current = candles[candles.length - 1] ?? null;
    }
    chart.timeScale().fitContent();
  }, [candles, ohlcv.data?.source]);

  // live ticks → mutate the in-progress candle without re-fetching REST
  const price = usePriceStream(address, chain, interval);
  useEffect(() => {
    const ev: PriceEvent | null = price.data ?? null;
    const series = seriesRef.current;
    if (!ev?.data || !series) return;
    const t = Number(ev.data.unixTime);
    const c = Number(ev.data.c);
    if (!Number.isFinite(t) || !Number.isFinite(c)) return;
    if (ohlcv.data?.source === "history_price") {
      (series as ISeriesApi<"Line">).update({
        time: t as UTCTimestamp,
        value: c,
      });
      return;
    }
    const o = Number(ev.data.o);
    const h = Number(ev.data.h);
    const l = Number(ev.data.l);
    const candle: CandlestickData = {
      time: t as UTCTimestamp,
      open: Number.isFinite(o) ? o : c,
      high: Number.isFinite(h) ? h : c,
      low: Number.isFinite(l) ? l : c,
      close: c,
    };
    (series as ISeriesApi<"Candlestick">).update(candle);
    lastCandleRef.current = candle;
  }, [price.data, ohlcv.data?.source]);

  return (
    <div className="rounded-md border bg-secondary/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex gap-1">
          {INTERVALS.map((i) => (
            <button
              key={i.id}
              onClick={() => setInterval(i.id)}
              className={cn(
                "rounded px-2 py-0.5 text-xs transition-colors",
                interval === i.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {ohlcv.isFetching && <span>loading…</span>}
          {ohlcv.data?.source === "history_price" && (
            <span title="OHLCV unavailable on this chain — line fallback">
              line fallback
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1",
              price.status === "open" && "text-emerald-400",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                price.status === "open"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-muted-foreground/40",
              )}
            />
            ws {price.status}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="h-[360px] w-full" />
      {ohlcv.error && (
        <div className="px-3 py-2 text-xs text-red-400 border-t border-border">
          {ohlcv.error.message}
        </div>
      )}
      {!ohlcv.isLoading && candles.length === 0 && (
        <div className="px-3 py-6 text-xs text-muted-foreground text-center">
          No candles available for this interval.
        </div>
      )}
    </div>
  );
}
