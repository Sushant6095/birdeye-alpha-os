/**
 * Cached Birdeye client. Mirrors the raw client signature exactly — swapping
 *
 *   import { getPrice } from "@/lib/birdeye";
 * to
 *   import { getPrice } from "@/lib/birdeye/cached";
 *
 * is a one-line change. Reads hit Redis (with Postgres fallback) before
 * falling through to the live API. Each network call is recorded to
 * `credit_usage_log` via the credit observer in `./credits.ts`.
 */
import { createHash } from "node:crypto";
import { cacheGet, cacheSet } from "../cache/redis";
import type { BirdeyeChain } from "./types/chain";
import { initCreditTracker, recordCacheHit } from "./credits";
import { getBirdeyeContext } from "./context";

import * as price from "./rest/price";
import * as stats from "./rest/stats";
import * as tokens from "./rest/tokens";
import * as transactions from "./rest/transactions";
import * as wallet from "./rest/wallet";
import * as holder from "./rest/holder";
import * as balance from "./rest/balance";
import * as blockchain from "./rest/blockchain";
import * as creation from "./rest/creation";
import * as memeMod from "./rest/meme";
import * as security from "./rest/security";
import * as smartmoney from "./rest/smartmoney";
import * as historyMod from "./rest/history";
import * as searchMod from "./rest/search";

initCreditTracker();

/* ------------------------------------------------------------------ */
/* Categories + TTLs (seconds)                                         */
/* ------------------------------------------------------------------ */
export type Category =
  | "security"
  | "metadata"
  | "holder"
  | "pnl"
  | "ohlcv"
  | "trending"
  | "price"
  | "networth"
  | "search"
  | "txs"
  | "transfers"
  | "list";

export const CATEGORY_TTL: Record<Category, number> = {
  security: 60 * 60,
  metadata: 24 * 60 * 60,
  holder: 10 * 60,
  pnl: 2 * 60,
  ohlcv: 60, // overridden per call by ohlcvTtlFor
  trending: 30,
  price: 3,
  networth: 60,
  search: 5 * 60,
  txs: 30,
  transfers: 60,
  list: 60,
};

const SHORT_OHLCV_FRAMES = new Set([
  "1s",
  "15s",
  "30s",
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
]);

/** OHLCV TTL: 5s for sub-hour candles, 60s for ≥1h. */
function ohlcvTtlFor(args: unknown[]): number {
  const input = args[0] as { type?: string } | undefined;
  return input?.type && SHORT_OHLCV_FRAMES.has(input.type) ? 5 : 60;
}

/* ------------------------------------------------------------------ */
/* Wrapper                                                             */
/* ------------------------------------------------------------------ */
const DEBUG =
  process.env.CACHE_DEBUG === "1" || process.env.CACHE_DEBUG === "true";

interface WrapOpts {
  category: Category;
  path: string;
  /** Override TTL based on call args. Falls back to CATEGORY_TTL[category]. */
  ttlFor?: (args: unknown[]) => number;
}

function makeKey(
  category: Category,
  path: string,
  args: unknown[],
): string {
  const input = args[0] ?? null;
  const chain = (args[1] as BirdeyeChain | undefined) ?? "default";
  const hash = createHash("sha1")
    .update(JSON.stringify(input))
    .digest("hex")
    .slice(0, 16);
  return `birdeye:${category}:${path}:${hash}:${chain}`;
}

type AsyncFn = (...args: never[]) => Promise<unknown>;

function wrap<F extends AsyncFn>(fn: F, opts: WrapOpts): F {
  return (async (...args: Parameters<F>): Promise<unknown> => {
    const ttl = opts.ttlFor?.(args) ?? CATEGORY_TTL[opts.category];
    const key = makeKey(opts.category, opts.path, args);
    const hit = await cacheGet<unknown>(key);
    if (hit !== null && hit !== undefined) {
      if (DEBUG) console.log(`[cache HIT] ${opts.path} key=${key}`);
      const chain = args[1] as string | undefined;
      recordCacheHit({
        endpoint: opts.path,
        chain,
        userId: getBirdeyeContext()?.userId,
      });
      return hit;
    }
    if (DEBUG) console.log(`[cache MISS] ${opts.path} key=${key}`);
    const data = await fn(...args);
    await cacheSet(key, data, ttl);
    return data;
  }) as F;
}

/* ------------------------------------------------------------------ */
/* Wrapped endpoint exports — same names as the raw client             */
/* ------------------------------------------------------------------ */

/* Price & OHLCV (12) */
export const getPrice = wrap(price.getPrice, {
  category: "price",
  path: "/defi/price",
});
export const getMultiPrice = wrap(price.getMultiPrice, {
  category: "price",
  path: "/defi/multi_price",
});
export const postMultiPrice = wrap(price.postMultiPrice, {
  category: "price",
  path: "POST /defi/multi_price",
});
export const getHistoricalPriceUnix = wrap(price.getHistoricalPriceUnix, {
  category: "metadata",
  path: "/defi/historical_price_unix",
});
export const getHistoryPrice = wrap(price.getHistoryPrice, {
  category: "ohlcv",
  path: "/defi/history_price",
  ttlFor: ohlcvTtlFor,
});
export const getPriceVolumeSingle = wrap(price.getPriceVolumeSingle, {
  category: "price",
  path: "/defi/price_volume/single",
});
export const postPriceVolumeMulti = wrap(price.postPriceVolumeMulti, {
  category: "price",
  path: "POST /defi/price_volume/multi",
});
export const getOhlcv = wrap(price.getOhlcv, {
  category: "ohlcv",
  path: "/defi/ohlcv",
  ttlFor: ohlcvTtlFor,
});
export const getOhlcvPair = wrap(price.getOhlcvPair, {
  category: "ohlcv",
  path: "/defi/ohlcv/pair",
  ttlFor: ohlcvTtlFor,
});
export const getOhlcvBaseQuote = wrap(price.getOhlcvBaseQuote, {
  category: "ohlcv",
  path: "/defi/ohlcv/base_quote",
  ttlFor: ohlcvTtlFor,
});
export const getOhlcvV3 = wrap(price.getOhlcvV3, {
  category: "ohlcv",
  path: "/defi/v3/ohlcv",
  ttlFor: ohlcvTtlFor,
});
export const getOhlcvPairV3 = wrap(price.getOhlcvPairV3, {
  category: "ohlcv",
  path: "/defi/v3/ohlcv/pair",
  ttlFor: ohlcvTtlFor,
});

/* Stats (7) */
export const getTokenOverview = wrap(stats.getTokenOverview, {
  category: "metadata",
  path: "/defi/token_overview",
});
export const getTokenMarketData = wrap(stats.getTokenMarketData, {
  category: "metadata",
  path: "/defi/v3/token/market-data",
});
export const getTokenTradeDataSingle = wrap(stats.getTokenTradeDataSingle, {
  category: "metadata",
  path: "/defi/v3/token/trade-data/single",
});
export const postTokenTradeDataMultiple = wrap(
  stats.postTokenTradeDataMultiple,
  {
    category: "metadata",
    path: "POST /defi/v3/token/trade-data/multiple",
  },
);
export const getPairOverviewSingle = wrap(stats.getPairOverviewSingle, {
  category: "metadata",
  path: "/defi/v3/pair/overview/single",
});
export const postPairOverviewMultiple = wrap(stats.postPairOverviewMultiple, {
  category: "metadata",
  path: "POST /defi/v3/pair/overview/multiple",
});
export const getTokenMetaDataSingle = wrap(stats.getTokenMetaDataSingle, {
  category: "metadata",
  path: "/defi/v3/token/meta-data/single",
});

/* Token / Market List (5) */
export const getTokenList = wrap(tokens.getTokenList, {
  category: "list",
  path: "/defi/tokenlist",
});
export const getTokenListV3 = wrap(tokens.getTokenListV3, {
  category: "list",
  path: "/defi/v3/token/list",
});
export const getTokenListScroll = wrap(tokens.getTokenListScroll, {
  category: "list",
  path: "/defi/v3/token/list/scroll",
});
export const getMarkets = wrap(tokens.getMarkets, {
  category: "list",
  path: "/defi/v2/markets",
});
export const getPairList = wrap(tokens.getPairList, {
  category: "list",
  path: "/defi/v3/pair/list",
});

/* Transactions (16) */
export const getTxsToken = wrap(transactions.getTxsToken, {
  category: "txs",
  path: "/defi/txs/token",
});
export const getTxsPair = wrap(transactions.getTxsPair, {
  category: "txs",
  path: "/defi/txs/pair",
});
export const getTxsTokenSeekByTime = wrap(transactions.getTxsTokenSeekByTime, {
  category: "txs",
  path: "/defi/txs/token/seek_by_time",
});
export const getTxsPairSeekByTime = wrap(transactions.getTxsPairSeekByTime, {
  category: "txs",
  path: "/defi/txs/pair/seek_by_time",
});
export const getTokenTxsV3 = wrap(transactions.getTokenTxsV3, {
  category: "txs",
  path: "/defi/v3/token/txs",
});
export const getPairTxsV3 = wrap(transactions.getPairTxsV3, {
  category: "txs",
  path: "/defi/v3/pair/txs",
});
export const getTokenTxsRecent = wrap(transactions.getTokenTxsRecent, {
  category: "txs",
  path: "/defi/v3/token/txs/recent",
});
export const getPairTxsRecent = wrap(transactions.getPairTxsRecent, {
  category: "txs",
  path: "/defi/v3/pair/txs/recent",
});
export const getAllTimeTradesSingle = wrap(transactions.getAllTimeTradesSingle, {
  category: "metadata",
  path: "/defi/v3/all-time/trades/single",
});
export const postAllTimeTradesMultiple = wrap(
  transactions.postAllTimeTradesMultiple,
  {
    category: "metadata",
    path: "POST /defi/v3/all-time/trades/multiple",
  },
);
export const getTraderTxsSeekByTime = wrap(transactions.getTraderTxsSeekByTime, {
  category: "txs",
  path: "/trader/txs/seek_by_time",
});
export const getGainersLosers = wrap(transactions.getGainersLosers, {
  category: "trending",
  path: "/trader/gainers-losers",
});
export const getTxsRecent = wrap(transactions.getTxsRecent, {
  category: "txs",
  path: "/defi/v3/txs/recent",
});
export const getLargeTrades = wrap(transactions.getLargeTrades, {
  category: "trending",
  path: "/defi/v3/large-trades",
});
export const getTokenLargeTrades = wrap(transactions.getTokenLargeTrades, {
  category: "trending",
  path: "/defi/v3/token/large-trades",
});
export const getPairLargeTrades = wrap(transactions.getPairLargeTrades, {
  category: "trending",
  path: "/defi/v3/pair/large-trades",
});

/* Wallet, Networth & PnL (15) */
export const listSupportedChain = wrap(wallet.listSupportedChain, {
  category: "metadata",
  path: "/v1/wallet/list_supported_chain",
});
export const getMultichainTokenList = wrap(wallet.getMultichainTokenList, {
  category: "networth",
  path: "/v1/wallet/multichain_token_list",
});
export const getWalletTokenList = wrap(wallet.getWalletTokenList, {
  category: "networth",
  path: "/v1/wallet/token_list",
});
export const getWalletTokenBalance = wrap(wallet.getWalletTokenBalance, {
  category: "networth",
  path: "/v1/wallet/token_balance",
});
export const getWalletTxList = wrap(wallet.getWalletTxList, {
  category: "txs",
  path: "/v1/wallet/tx_list",
});
export const getMultichainTxList = wrap(wallet.getMultichainTxList, {
  category: "txs",
  path: "/v1/wallet/multichain_tx_list",
});
export const postWalletSimulate = wrap(wallet.postWalletSimulate, {
  category: "trending", // simulation is volatile; keep TTL short
  path: "POST /v1/wallet/simulate",
});
export const getWalletNetworth = wrap(wallet.getWalletNetworth, {
  category: "networth",
  path: "/v1/wallet/networth",
});
export const getMultichainNetworth = wrap(wallet.getMultichainNetworth, {
  category: "networth",
  path: "/v1/wallet/multichain_networth",
});
export const getWalletPnLSummary = wrap(wallet.getWalletPnLSummary, {
  category: "pnl",
  path: "/trader/wallet/pnl-summary",
});
export const getWalletPnLDetail = wrap(wallet.getWalletPnLDetail, {
  category: "pnl",
  path: "/trader/wallet/pnl-detail",
});
export const getWalletPositions = wrap(wallet.getWalletPositions, {
  category: "pnl",
  path: "/trader/wallet/positions",
});
export const getWalletRealizedPnL = wrap(wallet.getWalletRealizedPnL, {
  category: "pnl",
  path: "/trader/wallet/realized-pnl",
});
export const getWalletUnrealizedPnL = wrap(wallet.getWalletUnrealizedPnL, {
  category: "pnl",
  path: "/trader/wallet/unrealized-pnl",
});
export const getWalletHoldings = wrap(wallet.getWalletHoldings, {
  category: "networth",
  path: "/trader/wallet/holdings",
});

/* Holder (5) */
export const getTokenHolder = wrap(holder.getTokenHolder, {
  category: "holder",
  path: "/defi/v3/token/holder",
});
export const getTopTraders = wrap(holder.getTopTraders, {
  category: "pnl",
  path: "/defi/v3/token/top_traders",
});
export const getTopTradersList = wrap(holder.getTopTradersList, {
  category: "pnl",
  path: "/defi/v3/token/top_traders/list",
});
export const getHolderDistribution = wrap(holder.getHolderDistribution, {
  category: "holder",
  path: "/defi/v3/token/holder/distribution",
});
export const getActiveHolders = wrap(holder.getActiveHolders, {
  category: "holder",
  path: "/defi/v3/token/holder/active",
});

/* Balance & Transfer (7) */
export const getBalanceToken = wrap(balance.getBalanceToken, {
  category: "networth",
  path: "/defi/v3/balance/token",
});
export const getBalanceWallet = wrap(balance.getBalanceWallet, {
  category: "networth",
  path: "/defi/v3/balance/wallet",
});
export const getBalanceMulti = wrap(balance.getBalanceMulti, {
  category: "networth",
  path: "/defi/v3/balance/multi",
});
export const getTransfersToken = wrap(balance.getTransfersToken, {
  category: "transfers",
  path: "/defi/v3/transfers/token",
});
export const getTransfersWallet = wrap(balance.getTransfersWallet, {
  category: "transfers",
  path: "/defi/v3/transfers/wallet",
});
export const getTransfersRecent = wrap(balance.getTransfersRecent, {
  category: "transfers",
  path: "/defi/v3/transfers/recent",
});
export const getTransfersMulti = wrap(balance.getTransfersMulti, {
  category: "transfers",
  path: "/defi/v3/transfers/multi",
});

/* Blockchain (2) */
export const getNetworks = wrap(blockchain.getNetworks, {
  category: "metadata",
  path: "/defi/v3/networks",
});
export const getBlockchainStats = wrap(blockchain.getBlockchainStats, {
  category: "metadata",
  path: "/defi/v3/blockchain/stats",
});

/* Creation & Trending (2) */
export const getTokenCreationInfo = wrap(creation.getTokenCreationInfo, {
  category: "metadata",
  path: "/defi/token_creation_info",
});
export const getTokenTrending = wrap(creation.getTokenTrending, {
  category: "trending",
  path: "/defi/token_trending",
});

/* Meme (2) */
export const getMemeList = wrap(memeMod.getMemeList, {
  category: "trending",
  path: "/defi/v3/meme/list",
});
export const getMemeTrending = wrap(memeMod.getMemeTrending, {
  category: "trending",
  path: "/defi/v3/meme/trending",
});

/* Security (1) */
export const getTokenSecurity = wrap(security.getTokenSecurity, {
  category: "security",
  path: "/defi/token_security",
});

/* Smart Money (1) */
export const getSmartMoneyList = wrap(smartmoney.getSmartMoneyList, {
  category: "trending",
  path: "/trader/smart-money/list",
});

/* All-time & History (2) */
export const getAllTimeHoldersSingle = wrap(historyMod.getAllTimeHoldersSingle, {
  category: "metadata",
  path: "/defi/v3/all-time/holders/single",
});
export const getHistoryPriceV3 = wrap(historyMod.getHistoryPriceV3, {
  category: "ohlcv",
  path: "/defi/v3/history/price",
  ttlFor: ohlcvTtlFor,
});

/* Search & Utils (2) */
export const search = wrap(searchMod.search, {
  category: "search",
  path: "/defi/v3/search",
});
export const getLegacyNetworks = wrap(searchMod.getLegacyNetworks, {
  category: "metadata",
  path: "/defi/networks",
});

/* Re-export raw error type + context helpers for callers */
export { BirdeyeError } from "./client";
export { runWithBirdeyeContext } from "./context";
export { getCreditsUsedToday, getCreditsLeftFromLog } from "./credits";
