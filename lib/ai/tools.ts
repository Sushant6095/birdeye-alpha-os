/**
 * Tool registry — one entry per Birdeye REST endpoint.
 *
 * Every tool wraps the cached client from Part 2 so identical calls within
 * TTL are free. Each tool's `inputSchema` is a Zod object that always
 * includes `chain`, then folds in the endpoint's actual input schema.
 *
 * Grouped objects (`tokenTools`, `walletTools`, …) get spread into one
 * top-level `tools` map at the end.
 */
import { tool } from "ai";
import { z } from "zod";
import * as client from "@/lib/birdeye/cached";

const chainField = z.object({
  chain: z
    .string()
    .default("solana")
    .describe(
      "Birdeye chain id (lowercase): solana, ethereum, base, arbitrum, optimism, polygon, bsc, avalanche, sui, etc.",
    ),
});

/** Tiny helper: merge chain into endpoint input schema and split at execute time. */
function bind<I extends z.ZodObject<z.ZodRawShape>>(
  description: string,
  endpointSchema: I,
  exec: (input: z.infer<I>, chain: string) => Promise<unknown>,
) {
  return tool({
    description,
    inputSchema: chainField.merge(endpointSchema),
    execute: async (raw) => {
      const { chain, ...rest } = raw as { chain: string } & z.infer<I>;
      try {
        return await exec(rest as z.infer<I>, chain);
      } catch (err) {
        return {
          error: (err as Error).message,
          endpoint: description,
        };
      }
    },
  });
}

/** No-input tool wrapper (e.g. networks / chains list). */
function nullary(description: string, exec: () => Promise<unknown>) {
  return tool({
    description,
    inputSchema: z.object({}).describe("no parameters"),
    execute: async () => {
      try {
        return await exec();
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
  });
}

/* ------------------------------------------------------------------ */
/* PRICE & OHLCV (12)                                                  */
/* ------------------------------------------------------------------ */

const addr = z.string().min(1).describe("Token / pair / wallet address");

export const priceTools = {
  getPrice: bind(
    "Single-token current price + liquidity. Use for quick price reads.",
    z.object({ address: addr, include_liquidity: z.boolean().optional() }),
    (input, chain) => client.getPrice(input, chain as never),
  ),
  getMultiPrice: bind(
    "Bulk current prices via GET. Pass list_address as a comma-separated string OR an array.",
    z.object({
      list_address: z.union([z.array(z.string()), z.string()]),
      include_liquidity: z.boolean().optional(),
    }),
    (input, chain) => client.getMultiPrice(input, chain as never),
  ),
  postMultiPrice: bind(
    "Bulk current prices via POST. Use when comparing > 5 tokens.",
    z.object({
      list_address: z.array(z.string()).min(1).max(100),
      include_liquidity: z.boolean().optional(),
    }),
    (input, chain) => client.postMultiPrice(input, chain as never),
  ),
  getHistoricalPriceUnix: bind(
    "Token price at a specific unix timestamp.",
    z.object({ address: addr, unixtime: z.number().int() }),
    (input, chain) => client.getHistoricalPriceUnix(input, chain as never),
  ),
  getHistoryPrice: bind(
    "Historical price line for a token.",
    z.object({
      address: addr,
      type: z.string().describe('e.g. "1m" "5m" "1H" "1D"'),
      time_from: z.number().int(),
      time_to: z.number().int(),
    }),
    (input, chain) => client.getHistoryPrice(input as never, chain as never),
  ),
  getPriceVolumeSingle: bind(
    "Price + volume + windowed change for a token.",
    z.object({
      address: addr,
      type: z.enum(["1h", "2h", "4h", "8h", "24h"]).optional(),
    }),
    (input, chain) => client.getPriceVolumeSingle(input, chain as never),
  ),
  postPriceVolumeMulti: bind(
    "Price+volume for multiple tokens at once.",
    z.object({
      list_address: z.array(z.string()).min(1).max(50),
      type: z.enum(["1h", "2h", "4h", "8h", "24h"]).optional(),
    }),
    (input, chain) => client.postPriceVolumeMulti(input, chain as never),
  ),
  getOhlcv: bind(
    "OHLCV candles for a token.",
    z.object({
      address: addr,
      type: z.string(),
      time_from: z.number().int().optional(),
      time_to: z.number().int().optional(),
    }),
    (input, chain) => client.getOhlcv(input as never, chain as never),
  ),
  getOhlcvPair: bind(
    "OHLCV candles for a pair (legacy endpoint).",
    z.object({
      address: addr,
      type: z.string(),
      time_from: z.number().int().optional(),
      time_to: z.number().int().optional(),
    }),
    (input, chain) => client.getOhlcvPair(input as never, chain as never),
  ),
  getOhlcvBaseQuote: bind(
    "OHLCV in base/quote ratio.",
    z.object({
      base_address: addr,
      quote_address: addr,
      type: z.string(),
      time_from: z.number().int().optional(),
      time_to: z.number().int().optional(),
    }),
    (input, chain) => client.getOhlcvBaseQuote(input as never, chain as never),
  ),
  getOhlcvV3: bind(
    "OHLCV V3 — preferred for token candles.",
    z.object({
      address: addr,
      type: z.string(),
      time_from: z.number().int().optional(),
      time_to: z.number().int().optional(),
    }),
    (input, chain) => client.getOhlcvV3(input as never, chain as never),
  ),
  getOhlcvPairV3: bind(
    "OHLCV V3 — preferred for pair candles.",
    z.object({
      address: addr,
      type: z.string(),
      time_from: z.number().int().optional(),
      time_to: z.number().int().optional(),
    }),
    (input, chain) => client.getOhlcvPairV3(input as never, chain as never),
  ),
};

/* ------------------------------------------------------------------ */
/* STATS (7)                                                           */
/* ------------------------------------------------------------------ */
export const statsTools = {
  getTokenOverview: bind(
    "Token overview — symbol, price, liquidity, supply, market cap, holder count. Top of any token brief.",
    z.object({ address: addr }),
    (input, chain) => client.getTokenOverview(input, chain as never),
  ),
  getTokenMarketData: bind(
    "Token market data — price, liquidity, supply, marketcap, FDV.",
    z.object({ address: addr }),
    (input, chain) => client.getTokenMarketData(input, chain as never),
  ),
  getTokenTradeDataSingle: bind(
    "Token trade data — buy/sell volumes, unique wallets, trade counts.",
    z.object({ address: addr }),
    (input, chain) => client.getTokenTradeDataSingle(input, chain as never),
  ),
  postTokenTradeDataMultiple: bind(
    "Bulk token trade data.",
    z.object({ list_address: z.array(addr).min(1).max(20) }),
    (input, chain) => client.postTokenTradeDataMultiple(input, chain as never),
  ),
  getPairOverviewSingle: bind(
    "Pair overview — base/quote, DEX source, liquidity, 24h vol.",
    z.object({ address: addr }),
    (input, chain) => client.getPairOverviewSingle(input, chain as never),
  ),
  postPairOverviewMultiple: bind(
    "Bulk pair overview.",
    z.object({ list_address: z.array(addr).min(1).max(20) }),
    (input, chain) => client.postPairOverviewMultiple(input, chain as never),
  ),
  getTokenMetaDataSingle: bind(
    "Token metadata — name, symbol, decimals, social links.",
    z.object({ address: addr }),
    (input, chain) => client.getTokenMetaDataSingle(input, chain as never),
  ),
};

/* ------------------------------------------------------------------ */
/* LIST (5)                                                            */
/* ------------------------------------------------------------------ */
export const listTools = {
  getTokenList: bind(
    "Legacy token list with sort by 24h vol / mc / 24h change.",
    z.object({
      sort_by: z.enum(["v24hUSD", "mc", "v24hChangePercent"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      min_liquidity: z.number().optional(),
    }),
    (input, chain) => client.getTokenList(input, chain as never),
  ),
  getTokenListV3: bind(
    "Token list V3 — supports many sort fields incl. price_change_24h_percent.",
    z.object({
      sort_by: z.string().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      min_liquidity: z.number().optional(),
      max_liquidity: z.number().optional(),
      min_market_cap: z.number().optional(),
      max_market_cap: z.number().optional(),
      min_volume_24h_usd: z.number().optional(),
    }),
    (input, chain) => client.getTokenListV3(input, chain as never),
  ),
  getTokenListScroll: bind(
    "Token list V3 with cursor pagination.",
    z.object({
      cursor: z.string().optional(),
      limit: z.number().int().optional(),
      sort_by: z.string().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
    }),
    (input, chain) => client.getTokenListScroll(input, chain as never),
  ),
  getMarkets: bind(
    "All markets (pairs) for a token, sortable by liquidity / volume.",
    z.object({
      address: addr,
      sort_by: z.enum(["liquidity", "volume24h"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (input, chain) => client.getMarkets(input, chain as never),
  ),
  getPairList: bind(
    "Chain-wide pair list V3.",
    z.object({
      sort_by: z.string().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      source: z.string().optional(),
    }),
    (input, chain) => client.getPairList(input, chain as never),
  ),
};

/* ------------------------------------------------------------------ */
/* TRANSACTIONS (16)                                                   */
/* ------------------------------------------------------------------ */
const txInput = z.object({
  address: addr,
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
  tx_type: z.enum(["swap", "add", "remove", "all"]).optional(),
  sort_type: z.enum(["asc", "desc"]).optional(),
});

export const transactionTools = {
  getTxsToken: bind("Token transactions (legacy).", txInput, (i, c) =>
    client.getTxsToken(i, c as never),
  ),
  getTxsPair: bind("Pair transactions (legacy).", txInput, (i, c) =>
    client.getTxsPair(i, c as never),
  ),
  getTxsTokenSeekByTime: bind(
    "Token tx scroll-back by time window.",
    z.object({
      address: addr,
      before_time: z.number().int().optional(),
      after_time: z.number().int().optional(),
      tx_type: z.enum(["swap", "add", "remove", "all"]).optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTxsTokenSeekByTime(i, c as never),
  ),
  getTxsPairSeekByTime: bind(
    "Pair tx scroll-back by time window.",
    z.object({
      address: addr,
      before_time: z.number().int().optional(),
      after_time: z.number().int().optional(),
      tx_type: z.enum(["swap", "add", "remove", "all"]).optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTxsPairSeekByTime(i, c as never),
  ),
  getTokenTxsV3: bind("Token transactions V3 (preferred).", txInput, (i, c) =>
    client.getTokenTxsV3(i, c as never),
  ),
  getPairTxsV3: bind("Pair transactions V3 (preferred).", txInput, (i, c) =>
    client.getPairTxsV3(i, c as never),
  ),
  getTokenTxsRecent: bind(
    "Most recent token txs.",
    z.object({ address: addr, limit: z.number().int().optional() }),
    (i, c) => client.getTokenTxsRecent(i, c as never),
  ),
  getPairTxsRecent: bind(
    "Most recent pair txs.",
    z.object({ address: addr, limit: z.number().int().optional() }),
    (i, c) => client.getPairTxsRecent(i, c as never),
  ),
  getAllTimeTradesSingle: bind(
    "Lifetime trade and volume totals for a token.",
    z.object({ address: addr }),
    (i, c) => client.getAllTimeTradesSingle(i, c as never),
  ),
  postAllTimeTradesMultiple: bind(
    "Lifetime trade totals for many tokens.",
    z.object({ list_address: z.array(addr).min(1).max(20) }),
    (i, c) => client.postAllTimeTradesMultiple(i, c as never),
  ),
  getTraderTxsSeekByTime: bind(
    "Wallet trade scroll-back by time.",
    z.object({
      address: addr,
      before_time: z.number().int().optional(),
      after_time: z.number().int().optional(),
      limit: z.number().int().optional(),
      tx_type: z.enum(["swap", "add", "remove", "all"]).optional(),
    }),
    (i, c) => client.getTraderTxsSeekByTime(i, c as never),
  ),
  getGainersLosers: bind(
    "Top gainers / losers by PnL or volume across the chain.",
    z.object({
      type: z
        .enum([
          "1h", "2h", "4h", "8h", "24h",
          "today", "yesterday", "1d", "1w", "1m", "1y", "all",
        ])
        .optional(),
      sort_by: z.enum(["PnL", "volume", "trade"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getGainersLosers(i, c as never),
  ),
  getTxsRecent: bind(
    "Chain-wide recent txs.",
    z.object({
      limit: z.number().int().optional(),
      source: z.string().optional(),
    }),
    (i, c) => client.getTxsRecent(i, c as never),
  ),
  getLargeTrades: bind(
    "Recent large trades chain-wide (whale firehose).",
    z.object({
      min_volume_usd: z.number().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getLargeTrades(i, c as never),
  ),
  getTokenLargeTrades: bind(
    "Whale trades on a specific token.",
    z.object({
      address: addr,
      min_volume_usd: z.number().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTokenLargeTrades(i, c as never),
  ),
  getPairLargeTrades: bind(
    "Whale trades on a specific pair.",
    z.object({
      address: addr,
      min_volume_usd: z.number().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getPairLargeTrades(i, c as never),
  ),
};

/* ------------------------------------------------------------------ */
/* WALLET (15)                                                         */
/* ------------------------------------------------------------------ */
const walletAddr = z.string().min(1).describe("Wallet address");

export const walletTools = {
  listSupportedChain: nullary(
    "Birdeye chains supported by the wallet endpoints.",
    () => client.listSupportedChain(),
  ),
  getMultichainTokenList: bind(
    "Wallet portfolio across all chains.",
    z.object({ wallet: walletAddr }),
    (i) => client.getMultichainTokenList(i),
  ),
  getWalletTokenList: bind(
    "Wallet portfolio for a single chain.",
    z.object({ wallet: walletAddr }),
    (i, c) => client.getWalletTokenList(i, c as never),
  ),
  getWalletTokenBalance: bind(
    "Single-token balance for a wallet.",
    z.object({ wallet: walletAddr, token_address: addr }),
    (i, c) => client.getWalletTokenBalance(i, c as never),
  ),
  getWalletTxList: bind(
    "Wallet recent tx list.",
    z.object({
      wallet: walletAddr,
      limit: z.number().int().optional(),
      before: z.string().optional(),
    }),
    (i, c) => client.getWalletTxList(i, c as never),
  ),
  getMultichainTxList: bind(
    "Wallet recent txs across chains.",
    z.object({
      wallet: walletAddr,
      limit: z.number().int().optional(),
    }),
    (i) => client.getMultichainTxList(i),
  ),
  postWalletSimulate: bind(
    "Simulate a wallet transaction.",
    z.object({
      wallet: walletAddr,
      encoded_tx: z.string().optional(),
      transaction: z.unknown().optional(),
    }),
    (i, c) => client.postWalletSimulate(i, c as never),
  ),
  getWalletNetworth: bind(
    "Wallet net worth (single chain).",
    z.object({ wallet: walletAddr }),
    (i, c) => client.getWalletNetworth(i, c as never),
  ),
  getMultichainNetworth: bind(
    "Wallet net worth across all chains.",
    z.object({ wallet: walletAddr }),
    (i) => client.getMultichainNetworth(i),
  ),
  getWalletPnLSummary: bind(
    "Wallet PnL summary (realized + unrealized + win rate + trades + volume).",
    z.object({
      address: walletAddr,
      type: z
        .enum([
          "1h", "2h", "4h", "8h", "24h",
          "today", "yesterday", "1d", "1w", "1m", "1y", "all",
        ])
        .optional(),
    }),
    (i, c) => client.getWalletPnLSummary(i, c as never),
  ),
  getWalletPnLDetail: bind(
    "Per-token PnL breakdown for a wallet.",
    z.object({
      address: walletAddr,
      type: z
        .enum([
          "1h", "2h", "4h", "8h", "24h",
          "today", "yesterday", "1d", "1w", "1m", "1y", "all",
        ])
        .optional(),
      sort_by: z.string().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getWalletPnLDetail(i, c as never),
  ),
  getWalletPositions: bind(
    "Wallet open positions.",
    z.object({
      address: walletAddr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getWalletPositions(i, c as never),
  ),
  getWalletRealizedPnL: bind(
    "Wallet realized PnL.",
    z.object({
      address: walletAddr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getWalletRealizedPnL(i, c as never),
  ),
  getWalletUnrealizedPnL: bind(
    "Wallet unrealized PnL.",
    z.object({
      address: walletAddr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getWalletUnrealizedPnL(i, c as never),
  ),
  getWalletHoldings: bind(
    "Wallet holdings (trader).",
    z.object({
      address: walletAddr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getWalletHoldings(i, c as never),
  ),
};

/* ------------------------------------------------------------------ */
/* HOLDER (5)                                                          */
/* ------------------------------------------------------------------ */
export const holderTools = {
  getTokenHolder: bind(
    "Top holders of a token.",
    z.object({
      address: addr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTokenHolder(i, c as never),
  ),
  getTopTraders: bind(
    "Most profitable traders for a token over a window.",
    z.object({
      address: addr,
      time_frame: z
        .enum(["1h", "2h", "4h", "8h", "24h"])
        .optional(),
      sort_by: z.enum(["volume", "trade", "PnL"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTopTraders(i, c as never),
  ),
  getTopTradersList: bind(
    "Top traders list (alt endpoint).",
    z.object({
      address: addr,
      time_frame: z
        .enum(["1h", "2h", "4h", "8h", "24h"])
        .optional(),
      sort_by: z.enum(["volume", "trade", "PnL"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTopTradersList(i, c as never),
  ),
  getHolderDistribution: bind(
    "Holder distribution buckets (e.g. < $100, < $1k, etc).",
    z.object({ address: addr }),
    (i, c) => client.getHolderDistribution(i, c as never),
  ),
  getActiveHolders: bind(
    "Active holders for a token over a window.",
    z.object({
      address: addr,
      type: z
        .enum([
          "1h", "2h", "4h", "8h", "24h",
          "today", "yesterday", "1d", "1w", "1m", "1y", "all",
        ])
        .optional(),
    }),
    (i, c) => client.getActiveHolders(i, c as never),
  ),
};

/* ------------------------------------------------------------------ */
/* BALANCE & TRANSFER (7)                                              */
/* ------------------------------------------------------------------ */
export const balanceTools = {
  getBalanceToken: bind(
    "Balance of a token in a wallet.",
    z.object({ wallet: walletAddr, token_address: addr }),
    (i, c) => client.getBalanceToken(i, c as never),
  ),
  getBalanceWallet: bind(
    "Wallet full balance.",
    z.object({ wallet: walletAddr }),
    (i, c) => client.getBalanceWallet(i, c as never),
  ),
  getBalanceMulti: bind(
    "Bulk balance lookup.",
    z.object({
      wallet: walletAddr,
      list_address: z.union([z.array(z.string()), z.string()]),
    }),
    (i, c) => client.getBalanceMulti(i, c as never),
  ),
  getTransfersToken: bind(
    "Transfers for a specific token.",
    z.object({
      address: addr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
    }),
    (i, c) => client.getTransfersToken(i, c as never),
  ),
  getTransfersWallet: bind(
    "Transfers for a specific wallet.",
    z.object({
      wallet: walletAddr,
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      token_address: addr.optional(),
    }),
    (i, c) => client.getTransfersWallet(i, c as never),
  ),
  getTransfersRecent: bind(
    "Chain-wide recent transfers.",
    z.object({ limit: z.number().int().optional() }),
    (i, c) => client.getTransfersRecent(i, c as never),
  ),
  getTransfersMulti: bind(
    "Multi-token transfer lookup.",
    z.object({
      wallet: walletAddr.optional(),
      list_address: z.union([z.array(z.string()), z.string()]),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTransfersMulti(i, c as never),
  ),
};

/* ------------------------------------------------------------------ */
/* BLOCKCHAIN / CREATION / MEME / SECURITY / SMART MONEY / HISTORY     */
/* / SEARCH (12)                                                       */
/* ------------------------------------------------------------------ */
export const blockchainTools = {
  getNetworks: nullary("Birdeye networks list.", () => client.getNetworks()),
  getBlockchainStats: tool({
    description: "Chain-level stats: latest block, last block time, daily volume.",
    inputSchema: chainField,
    execute: async ({ chain }) => {
      try {
        return await client.getBlockchainStats(chain as never);
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
  }),
};

export const creationTools = {
  getTokenCreationInfo: bind(
    "Creation info: deployer, deploy time, tx.",
    z.object({ address: addr }),
    (i, c) => client.getTokenCreationInfo(i, c as never),
  ),
  getTokenTrending: bind(
    "Trending tokens list.",
    z.object({
      sort_by: z.enum(["rank", "volume24hUSD", "liquidity"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getTokenTrending(i, c as never),
  ),
};

export const memeTools = {
  getMemeList: bind(
    "Meme tokens list (sortable, filter by source).",
    z.object({
      sort_by: z.string().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      source: z.string().optional(),
      graduated: z.boolean().optional(),
    }),
    (i, c) => client.getMemeList(i, c as never),
  ),
  getMemeTrending: bind(
    "Trending meme tokens.",
    z.object({
      sort_by: z.string().optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getMemeTrending(i, c as never),
  ),
};

export const securityTools = {
  getTokenSecurity: bind(
    "Token security checks: mint authority, freeze authority, owner, top-10 concentration.",
    z.object({ address: addr }),
    (i, c) => client.getTokenSecurity(i, c as never),
  ),
};

export const smartMoneyTools = {
  getSmartMoneyList: bind(
    "Smart money wallet ranking (sort by pnl / volume / trades / win_rate).",
    z.object({
      type: z
        .enum([
          "1h", "2h", "4h", "8h", "24h",
          "today", "yesterday", "1d", "1w", "1m", "1y", "all",
        ])
        .optional(),
      sort_by: z.enum(["pnl", "volume", "trade", "win_rate"]).optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
    (i, c) => client.getSmartMoneyList(i, c as never),
  ),
};

export const historyTools = {
  getAllTimeHoldersSingle: bind(
    "Lifetime unique holders for a token.",
    z.object({ address: addr }),
    (i, c) => client.getAllTimeHoldersSingle(i, c as never),
  ),
  getHistoryPriceV3: bind(
    "Historical price V3.",
    z.object({
      address: addr,
      type: z.string(),
      time_from: z.number().int(),
      time_to: z.number().int(),
    }),
    (i, c) => client.getHistoryPriceV3(i, c as never),
  ),
};

export const searchTools = {
  search: bind(
    "Universal search across tokens / pairs / wallets.",
    z.object({
      keyword: z.string().min(1),
      target: z
        .enum(["token", "market", "all", "wallet", "pair"])
        .optional(),
      sort_by: z
        .enum(["liquidity", "volume_24h_usd", "fdv", "marketcap"])
        .optional(),
      sort_type: z.enum(["asc", "desc"]).optional(),
      offset: z.number().int().optional(),
      limit: z.number().int().optional(),
      verify_token: z.boolean().optional(),
    }),
    (i, c) => client.search(i, c as never),
  ),
  getLegacyNetworks: nullary(
    "Legacy networks list (utility).",
    () => client.getLegacyNetworks(),
  ),
};

/* ------------------------------------------------------------------ */
/* COMBINED REGISTRY                                                   */
/* ------------------------------------------------------------------ */

export const allTools = {
  ...priceTools,
  ...statsTools,
  ...listTools,
  ...transactionTools,
  ...walletTools,
  ...holderTools,
  ...balanceTools,
  ...blockchainTools,
  ...creationTools,
  ...memeTools,
  ...securityTools,
  ...smartMoneyTools,
  ...historyTools,
  ...searchTools,
};

export type ToolName = keyof typeof allTools;
