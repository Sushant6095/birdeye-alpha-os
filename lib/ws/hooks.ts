"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

const DEFAULT_BASE = "http://localhost:4001";

function sidecarBase(): string {
  // browser env (Next.js inlines NEXT_PUBLIC_*)
  if (typeof process !== "undefined") {
    const v = process.env.NEXT_PUBLIC_WS_SIDECAR_URL;
    if (v) return v.replace(/\/$/, "");
  }
  return DEFAULT_BASE;
}

export type StreamStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface StreamHandle<T> {
  /** Latest event payload (parsed JSON). `null` until the first event arrives. */
  data: T | null;
  /** All recent events, newest first, capped to `bufferSize` (default 50). */
  buffer: T[];
  status: StreamStatus;
  error: string | null;
  /** Force-close & re-open the underlying EventSource. */
  reconnect: () => void;
}

interface BaseOpts {
  enabled?: boolean;
  bufferSize?: number;
}

/* ------------------------------------------------------------------ */
/* Generic SSE hook                                                    */
/* ------------------------------------------------------------------ */

function buildUrl(
  topic: string,
  query: Record<string, string | number | boolean | undefined>,
): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return `${sidecarBase()}/sse/${topic}${qs ? `?${qs}` : ""}`;
}

function useSseStream<T>(
  topic: string,
  query: Record<string, string | number | boolean | undefined>,
  opts: BaseOpts | undefined,
): StreamHandle<T> {
  const enabled = opts?.enabled ?? true;
  const bufferSize = opts?.bufferSize ?? 50;
  const [data, setData] = useState<T | null>(null);
  const [buffer, setBuffer] = useState<T[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const url = useMemo(() => buildUrl(topic, query), [topic, JSON.stringify(query)]);

  const reconnect = useCallback(() => setNonce((n) => n + 1), []);

  // Keep latest bufferSize without re-creating effect on each change
  const bufferSizeRef = useRef(bufferSize);
  bufferSizeRef.current = bufferSize;

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    const es = new EventSource(url);
    setStatus("connecting");
    setError(null);

    es.addEventListener("ready", () => setStatus("open"));

    es.onopen = () => setStatus("open");

    es.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as T;
        setData(parsed);
        setBuffer((prev) => [parsed, ...prev].slice(0, bufferSizeRef.current));
      } catch (err) {
        setError((err as Error).message);
      }
    };

    es.onerror = () => {
      setStatus("error");
      setError("EventSource error");
      // Browser will auto-reconnect; we surface "error" briefly
    };

    return () => {
      es.close();
      setStatus("closed");
    };
  }, [url, enabled, nonce]);

  return { data, buffer, status, error, reconnect };
}

/* ------------------------------------------------------------------ */
/* 9 typed hooks — one per Birdeye WS topic                            */
/* ------------------------------------------------------------------ */

export interface PriceEvent {
  type: string;
  data?: { o: number; h: number; l: number; c: number; v?: number; address?: string; unixTime?: number };
}

export function usePriceStream(
  address: string | undefined,
  chain: string = "solana",
  interval: string = "1m",
  opts?: BaseOpts,
): StreamHandle<PriceEvent> {
  return useSseStream<PriceEvent>(
    "price",
    { chain, address, interval },
    { ...opts, enabled: (opts?.enabled ?? true) && !!address },
  );
}

export interface TradeEvent {
  type: string;
  data?: { txHash?: string; volumeUsd?: number; address?: string };
}

export function useTradeStream(
  address: string | undefined,
  chain: string = "solana",
  opts?: BaseOpts & { queryType?: "simple" | "complex" },
): StreamHandle<TradeEvent> {
  return useSseStream<TradeEvent>(
    "txs",
    { chain, address, queryType: opts?.queryType ?? "simple" },
    { ...opts, enabled: (opts?.enabled ?? true) && !!address },
  );
}

export interface NewListingEvent {
  type: string;
  data?: { address: string; symbol?: string; createdTime?: number };
}

export function useNewListingStream(
  chain: string = "solana",
  opts?: BaseOpts & { memePlatformEnabled?: boolean; minLiquidity?: number },
): StreamHandle<NewListingEvent> {
  return useSseStream<NewListingEvent>(
    "new_listing",
    {
      chain,
      memePlatformEnabled: opts?.memePlatformEnabled ? "1" : undefined,
      minLiquidity: opts?.minLiquidity,
    },
    opts,
  );
}

export interface NewPairEvent {
  type: string;
  data?: { address?: string; base?: unknown; quote?: unknown };
}

export function useNewPairStream(
  chain: string = "solana",
  opts?: BaseOpts & { minLiquidity?: number },
): StreamHandle<NewPairEvent> {
  return useSseStream<NewPairEvent>(
    "new_pair",
    { chain, minLiquidity: opts?.minLiquidity },
    opts,
  );
}

export interface LargeTradeEvent {
  type: string;
  data?: { volumeUsd?: number; address?: string; side?: string };
}

export function useLargeTradeStream(
  chain: string = "solana",
  minUsd: number = 0,
  opts?: BaseOpts,
): StreamHandle<LargeTradeEvent> {
  return useSseStream<LargeTradeEvent>("large_trade", { chain, minUsd }, opts);
}

export interface WalletTxEvent {
  type: string;
  data?: { txHash?: string; from?: unknown; to?: unknown };
}

export function useWalletTxStream(
  address: string | undefined,
  chain: string = "solana",
  opts?: BaseOpts,
): StreamHandle<WalletTxEvent> {
  return useSseStream<WalletTxEvent>(
    "wallet_txs",
    { chain, address },
    { ...opts, enabled: (opts?.enabled ?? true) && !!address },
  );
}

export interface TokenStatsEvent {
  type: string;
  data?: { address?: string; price?: number; liquidity?: number };
}

export function useTokenStatsStream(
  address: string | undefined,
  chain: string = "solana",
  opts?: BaseOpts,
): StreamHandle<TokenStatsEvent> {
  return useSseStream<TokenStatsEvent>(
    "token_stats",
    { chain, address },
    { ...opts, enabled: (opts?.enabled ?? true) && !!address },
  );
}

export interface MemeStatsEvent {
  type: string;
  data?: unknown;
}

export function useMemeStatsStream(
  chain: string = "solana",
  opts?: BaseOpts,
): StreamHandle<MemeStatsEvent> {
  return useSseStream<MemeStatsEvent>("meme_stats", { chain }, opts);
}

export interface BaseQuotePriceEvent {
  type: string;
  data?: {
    o: number;
    h: number;
    l: number;
    c: number;
    v?: number;
    baseAddress?: string;
    quoteAddress?: string;
  };
}

export function useBaseQuotePriceStream(
  base: string | undefined,
  quote: string | undefined,
  chain: string = "solana",
  interval: string = "1m",
  opts?: BaseOpts,
): StreamHandle<BaseQuotePriceEvent> {
  return useSseStream<BaseQuotePriceEvent>(
    "base_quote_price",
    { chain, base, quote, interval },
    { ...opts, enabled: (opts?.enabled ?? true) && !!base && !!quote },
  );
}
