/**
 * Topic taxonomy for the 9 Birdeye WebSocket subscription types.
 *
 * Each topic is identified by a stable string key derived from kind + params.
 * The sidecar opens at most one upstream subscription per (chain, key); SSE
 * subscribers ref-count it.
 */

export type TopicKind =
  | "price"
  | "txs"
  | "base_quote_price"
  | "new_listing"
  | "new_pair"
  | "large_trade"
  | "wallet_txs"
  | "token_stats"
  | "meme_stats";

export const TOPIC_KINDS: TopicKind[] = [
  "price",
  "txs",
  "base_quote_price",
  "new_listing",
  "new_pair",
  "large_trade",
  "wallet_txs",
  "token_stats",
  "meme_stats",
];

export interface PriceParams {
  address: string;
  chartType?: string; // 1m, 5m, 1h, 1d, …
  currency?: "usd" | "pair" | "native";
}

export interface TxsParams {
  address: string;
  queryType?: "simple" | "complex";
}

export interface BaseQuotePriceParams {
  baseAddress: string;
  quoteAddress: string;
  chartType?: string;
}

export interface NewListingParams {
  memePlatformEnabled?: boolean;
  minLiquidity?: number;
}

export interface NewPairParams {
  minLiquidity?: number;
}

export interface LargeTradeParams {
  minVolume?: number;
}

export interface WalletTxsParams {
  address: string;
}

export interface TokenStatsParams {
  address: string;
}

export type MemeStatsParams = Record<string, never>;

export type TopicParams =
  | { kind: "price"; params: PriceParams }
  | { kind: "txs"; params: TxsParams }
  | { kind: "base_quote_price"; params: BaseQuotePriceParams }
  | { kind: "new_listing"; params: NewListingParams }
  | { kind: "new_pair"; params: NewPairParams }
  | { kind: "large_trade"; params: LargeTradeParams }
  | { kind: "wallet_txs"; params: WalletTxsParams }
  | { kind: "token_stats"; params: TokenStatsParams }
  | { kind: "meme_stats"; params: MemeStatsParams };

/** Stable, normalized key for a topic. Same params → same key. */
export function topicKey(t: TopicParams): string {
  switch (t.kind) {
    case "price":
      return `price:${t.params.address.toLowerCase()}:${t.params.chartType ?? "1m"}:${t.params.currency ?? "usd"}`;
    case "txs":
      return `txs:${t.params.address.toLowerCase()}:${t.params.queryType ?? "simple"}`;
    case "base_quote_price":
      return `bqp:${t.params.baseAddress.toLowerCase()}:${t.params.quoteAddress.toLowerCase()}:${t.params.chartType ?? "1m"}`;
    case "new_listing":
      return `new_listing:${t.params.memePlatformEnabled ? 1 : 0}:${t.params.minLiquidity ?? 0}`;
    case "new_pair":
      return `new_pair:${t.params.minLiquidity ?? 0}`;
    case "large_trade":
      return `large_trade:${t.params.minVolume ?? 0}`;
    case "wallet_txs":
      return `wallet_txs:${t.params.address.toLowerCase()}`;
    case "token_stats":
      return `token_stats:${t.params.address.toLowerCase()}`;
    case "meme_stats":
      return `meme_stats:_`;
  }
}

/* ------------------------------------------------------------------ */
/* Birdeye subscribe message builders                                  */
/* Mappings inferred from https://docs.birdeye.so/reference/websocket  */
/* ------------------------------------------------------------------ */

export function buildSubscribeMessage(t: TopicParams): unknown {
  switch (t.kind) {
    case "price":
      return {
        type: "SUBSCRIBE_PRICE",
        data: {
          chartType: t.params.chartType ?? "1m",
          address: t.params.address,
          currency: t.params.currency ?? "usd",
        },
      };
    case "txs":
      return {
        type: "SUBSCRIBE_TXS",
        data: {
          queryType: t.params.queryType ?? "simple",
          address: t.params.address,
        },
      };
    case "base_quote_price":
      return {
        type: "SUBSCRIBE_BASE_QUOTE_PRICE",
        data: {
          chartType: t.params.chartType ?? "1m",
          baseAddress: t.params.baseAddress,
          quoteAddress: t.params.quoteAddress,
        },
      };
    case "new_listing":
      return {
        type: "SUBSCRIBE_TOKEN_NEW_LISTING",
        data: {
          meme_platform_enabled: t.params.memePlatformEnabled ?? false,
          min_liquidity: t.params.minLiquidity ?? 0,
        },
      };
    case "new_pair":
      return {
        type: "SUBSCRIBE_NEW_PAIR",
        data: { min_liquidity: t.params.minLiquidity ?? 0 },
      };
    case "large_trade":
      return {
        type: "SUBSCRIBE_LARGE_TRADE_TXS",
        data: { min_volume: t.params.minVolume ?? 0 },
      };
    case "wallet_txs":
      return {
        type: "SUBSCRIBE_WALLET_TXS",
        data: { address: t.params.address },
      };
    case "token_stats":
      return {
        type: "SUBSCRIBE_TOKEN_STATS",
        data: { address: t.params.address },
      };
    case "meme_stats":
      return { type: "SUBSCRIBE_MEME_STATS", data: {} };
  }
}

export function buildUnsubscribeMessage(t: TopicParams): unknown {
  switch (t.kind) {
    case "price":
      return { type: "UNSUBSCRIBE_PRICE" };
    case "txs":
      return { type: "UNSUBSCRIBE_TXS" };
    case "base_quote_price":
      return { type: "UNSUBSCRIBE_BASE_QUOTE_PRICE" };
    case "new_listing":
      return { type: "UNSUBSCRIBE_TOKEN_NEW_LISTING" };
    case "new_pair":
      return { type: "UNSUBSCRIBE_NEW_PAIR" };
    case "large_trade":
      return { type: "UNSUBSCRIBE_LARGE_TRADE_TXS" };
    case "wallet_txs":
      return { type: "UNSUBSCRIBE_WALLET_TXS" };
    case "token_stats":
      return { type: "UNSUBSCRIBE_TOKEN_STATS" };
    case "meme_stats":
      return { type: "UNSUBSCRIBE_MEME_STATS" };
  }
}

/** Map an inbound event payload to the kind it belongs to (so we route it). */
export function eventKindFromMessage(msg: unknown): TopicKind | null {
  if (!msg || typeof msg !== "object") return null;
  const t = (msg as { type?: string }).type;
  if (!t) return null;
  // PRICE_DATA, TXS_DATA, BASE_QUOTE_PRICE_DATA, …
  if (t.startsWith("PRICE_DATA")) return "price";
  if (t.startsWith("TXS_DATA")) return "txs";
  if (t.startsWith("BASE_QUOTE_PRICE_DATA")) return "base_quote_price";
  if (t.startsWith("TOKEN_NEW_LISTING")) return "new_listing";
  if (t.startsWith("NEW_PAIR_DATA") || t === "NEW_PAIR") return "new_pair";
  if (t.startsWith("LARGE_TRADE_TXS_DATA") || t.startsWith("LARGE_TRADE"))
    return "large_trade";
  if (t.startsWith("WALLET_TXS_DATA")) return "wallet_txs";
  if (t.startsWith("TOKEN_STATS_DATA") || t === "TOKEN_STATS")
    return "token_stats";
  if (t.startsWith("MEME_STATS_DATA") || t === "MEME_STATS") return "meme_stats";
  return null;
}

/**
 * Decide whether a routed event matches a given topic's params.
 * Used to fan out one-per-chain ws responses to address-specific topics.
 */
export function eventMatchesTopic(
  event: unknown,
  topic: TopicParams,
): boolean {
  const data =
    (event as { data?: Record<string, unknown> }).data ??
    (event as Record<string, unknown>);
  const dataAddr = String(
    (data as Record<string, unknown>)["address"] ?? "",
  ).toLowerCase();

  switch (topic.kind) {
    case "price":
    case "txs":
    case "wallet_txs":
    case "token_stats":
      if (!dataAddr) return true;
      return dataAddr === topic.params.address.toLowerCase();
    case "base_quote_price": {
      const base = String(
        (data as Record<string, unknown>)["baseAddress"] ??
          (data as Record<string, unknown>)["base_address"] ??
          "",
      ).toLowerCase();
      const quote = String(
        (data as Record<string, unknown>)["quoteAddress"] ??
          (data as Record<string, unknown>)["quote_address"] ??
          "",
      ).toLowerCase();
      if (!base && !quote) return true;
      return (
        base === topic.params.baseAddress.toLowerCase() &&
        quote === topic.params.quoteAddress.toLowerCase()
      );
    }
    case "new_listing":
    case "new_pair":
    case "large_trade":
    case "meme_stats":
      return true;
  }
}
