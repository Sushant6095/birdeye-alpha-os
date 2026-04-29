import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { SortTypeSchema } from "../types/common";

const TokenListItemSchema = z
  .object({
    address: z.string(),
    symbol: z.string().optional(),
    name: z.string().optional(),
    decimals: z.number().optional(),
    logoURI: z.string().optional(),
    liquidity: z.number().optional(),
    price: z.number().optional(),
    v24hUSD: z.number().optional(),
    mc: z.number().optional(),
    marketCap: z.number().optional(),
  })
  .passthrough();

const TokenListPageSchema = z
  .object({
    updateUnixTime: z.number().optional(),
    updateTime: z.string().optional(),
    tokens: z.array(TokenListItemSchema).optional(),
    items: z.array(TokenListItemSchema).optional(),
    total: z.number().optional(),
    next_cursor: z.string().nullish(),
  })
  .passthrough();

/* ------------------------------------------------------------------ */
/* 1. GET /defi/tokenlist                                              */
/*    https://docs.birdeye.so/reference/get_defi-tokenlist            */
/* ------------------------------------------------------------------ */
export const GetTokenListInput = z.object({
  sort_by: z.enum(["v24hUSD", "mc", "v24hChangePercent"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  min_liquidity: z.number().optional(),
});
export type GetTokenListInput = z.infer<typeof GetTokenListInput>;

export function getTokenList(input: GetTokenListInput = {}, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/tokenlist", {
    input: GetTokenListInput,
    output: TokenListPageSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 2. GET /defi/v3/token/list                                          */
/*    https://docs.birdeye.so/reference/get_defi-v3-token-list        */
/* ------------------------------------------------------------------ */
export const GetTokenListV3Input = z.object({
  sort_by: z.string().optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  min_liquidity: z.number().optional(),
  max_liquidity: z.number().optional(),
  min_market_cap: z.number().optional(),
  max_market_cap: z.number().optional(),
  min_volume_24h_usd: z.number().optional(),
  max_volume_24h_usd: z.number().optional(),
  min_holder: z.number().optional(),
  min_trade_24h_count: z.number().optional(),
});
export type GetTokenListV3Input = z.infer<typeof GetTokenListV3Input>;

export function getTokenListV3(
  input: GetTokenListV3Input = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/list", {
    input: GetTokenListV3Input,
    output: TokenListPageSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 3. GET /defi/v3/token/list/scroll — cursor pagination               */
/* ------------------------------------------------------------------ */
export const GetTokenListScrollInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort_by: z.string().optional(),
  sort_type: SortTypeSchema.optional(),
});
export type GetTokenListScrollInput = z.infer<typeof GetTokenListScrollInput>;

export function getTokenListScroll(
  input: GetTokenListScrollInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/list/scroll", {
    input: GetTokenListScrollInput,
    output: TokenListPageSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 4. GET /defi/v2/markets — pair/market list for a token              */
/*    https://docs.birdeye.so/reference/get_defi-v2-markets           */
/* ------------------------------------------------------------------ */
export const GetMarketsInput = z.object({
  address: z.string(),
  sort_by: z.enum(["liquidity", "volume24h"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type GetMarketsInput = z.infer<typeof GetMarketsInput>;

export const MarketsOutput = z
  .object({
    items: z.array(z.unknown()).optional(),
    total: z.number().optional(),
  })
  .passthrough();

export function getMarkets(input: GetMarketsInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v2/markets", {
    input: GetMarketsInput,
    output: MarketsOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 5. GET /defi/v3/pair/list                                           */
/*    https://docs.birdeye.so/reference/get_defi-v3-pair-list         */
/* ------------------------------------------------------------------ */
export const GetPairListInput = z.object({
  sort_by: z.string().optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  source: z.string().optional(),
});
export type GetPairListInput = z.infer<typeof GetPairListInput>;

export function getPairList(input: GetPairListInput = {}, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/pair/list", {
    input: GetPairListInput,
    output: TokenListPageSchema,
    params: input,
    chain,
  });
}
