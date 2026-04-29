import { z } from "zod";
import { birdeyeGet, birdeyePost } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema } from "../types/common";

const TokenOverviewSchema = z
  .object({
    address: z.string(),
    decimals: z.number().optional(),
    symbol: z.string().optional(),
    name: z.string().optional(),
    logoURI: z.string().optional(),
    extensions: z.unknown().optional(),
    liquidity: z.number().optional(),
    price: z.number().optional(),
    supply: z.number().optional(),
    mc: z.number().optional(),
    marketCap: z.number().optional(),
    circulatingSupply: z.number().optional(),
    holder: z.number().optional(),
  })
  .passthrough();

const PairOverviewSchema = z
  .object({
    address: z.string(),
    base: z.unknown().optional(),
    quote: z.unknown().optional(),
    source: z.string().optional(),
    liquidity: z.number().optional(),
    price: z.number().optional(),
    volume24h: z.number().optional(),
    txCount24h: z.number().optional(),
  })
  .passthrough();

/* ------------------------------------------------------------------ */
/* 1. GET /defi/token_overview                                         */
/*    https://docs.birdeye.so/reference/get_defi-token-overview       */
/* ------------------------------------------------------------------ */
export const GetTokenOverviewInput = z.object({
  address: AddressSchema,
  frames: z.string().optional(),
});
export type GetTokenOverviewInput = z.infer<typeof GetTokenOverviewInput>;

export function getTokenOverview(
  input: GetTokenOverviewInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/token_overview", {
    input: GetTokenOverviewInput,
    output: TokenOverviewSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 2. GET /defi/v3/token/market-data                                   */
/*    https://docs.birdeye.so/reference/get_defi-v3-token-market-data */
/* ------------------------------------------------------------------ */
export const GetTokenMarketDataInput = z.object({
  address: AddressSchema,
});
export type GetTokenMarketDataInput = z.infer<typeof GetTokenMarketDataInput>;

export const TokenMarketDataSchema = z
  .object({
    address: z.string(),
    price: z.number().optional(),
    liquidity: z.number().optional(),
    supply: z.number().optional(),
    marketcap: z.number().optional(),
    circulating_supply: z.number().optional(),
    circulating_marketcap: z.number().optional(),
  })
  .passthrough();

export function getTokenMarketData(
  input: GetTokenMarketDataInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/market-data", {
    input: GetTokenMarketDataInput,
    output: TokenMarketDataSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 3. GET /defi/v3/token/trade-data/single                             */
/*    https://docs.birdeye.so/reference/get_defi-v3-token-trade-data-single */
/* ------------------------------------------------------------------ */
export const GetTokenTradeDataSingleInput = z.object({
  address: AddressSchema,
});
export type GetTokenTradeDataSingleInput = z.infer<
  typeof GetTokenTradeDataSingleInput
>;

export const TokenTradeDataSchema = z
  .object({ address: z.string() })
  .passthrough();

export function getTokenTradeDataSingle(
  input: GetTokenTradeDataSingleInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/trade-data/single", {
    input: GetTokenTradeDataSingleInput,
    output: TokenTradeDataSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 4. POST /defi/v3/token/trade-data/multiple                          */
/* ------------------------------------------------------------------ */
export const PostTokenTradeDataMultipleInput = z.object({
  list_address: z.array(AddressSchema).min(1).max(20),
});
export type PostTokenTradeDataMultipleInput = z.infer<
  typeof PostTokenTradeDataMultipleInput
>;

export const TokenTradeDataMultiSchema = z.record(
  z.string(),
  TokenTradeDataSchema,
);

export function postTokenTradeDataMultiple(
  input: PostTokenTradeDataMultipleInput,
  chain?: BirdeyeChain,
) {
  return birdeyePost("/defi/v3/token/trade-data/multiple", {
    input: PostTokenTradeDataMultipleInput,
    output: TokenTradeDataMultiSchema,
    body: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 5. GET /defi/v3/pair/overview/single                                */
/*    https://docs.birdeye.so/reference/get_defi-v3-pair-overview-single */
/* ------------------------------------------------------------------ */
export const GetPairOverviewSingleInput = z.object({
  address: AddressSchema,
});
export type GetPairOverviewSingleInput = z.infer<
  typeof GetPairOverviewSingleInput
>;

export function getPairOverviewSingle(
  input: GetPairOverviewSingleInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/pair/overview/single", {
    input: GetPairOverviewSingleInput,
    output: PairOverviewSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 6. POST /defi/v3/pair/overview/multiple                             */
/* ------------------------------------------------------------------ */
export const PostPairOverviewMultipleInput = z.object({
  list_address: z.array(AddressSchema).min(1).max(20),
});
export type PostPairOverviewMultipleInput = z.infer<
  typeof PostPairOverviewMultipleInput
>;

export const PairOverviewMultiSchema = z.record(z.string(), PairOverviewSchema);

export function postPairOverviewMultiple(
  input: PostPairOverviewMultipleInput,
  chain?: BirdeyeChain,
) {
  return birdeyePost("/defi/v3/pair/overview/multiple", {
    input: PostPairOverviewMultipleInput,
    output: PairOverviewMultiSchema,
    body: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 7. GET /defi/v3/token/meta-data/single                              */
/*    https://docs.birdeye.so/reference/get_defi-v3-token-meta-data-single */
/* ------------------------------------------------------------------ */
export const GetTokenMetaDataSingleInput = z.object({
  address: AddressSchema,
});
export type GetTokenMetaDataSingleInput = z.infer<
  typeof GetTokenMetaDataSingleInput
>;

export const TokenMetaDataSchema = z
  .object({
    address: z.string(),
    symbol: z.string().optional(),
    name: z.string().optional(),
    decimals: z.number().optional(),
    logo_uri: z.string().optional(),
    extensions: z.unknown().optional(),
  })
  .passthrough();

export function getTokenMetaDataSingle(
  input: GetTokenMetaDataSingleInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/meta-data/single", {
    input: GetTokenMetaDataSingleInput,
    output: TokenMetaDataSchema,
    params: input,
    chain,
  });
}
