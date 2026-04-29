import { z } from "zod";
import { birdeyeGet, birdeyePost } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema, TimeframeSchema } from "../types/common";

/* ------------------------------------------------------------------ */
/* Shared response schemas                                            */
/* ------------------------------------------------------------------ */

const PricePointSchema = z
  .object({
    value: z.number().nullable().optional(),
    updateUnixTime: z.number().optional(),
    updateHumanTime: z.string().optional(),
    priceChange24h: z.number().optional(),
    liquidity: z.number().optional(),
    valueUsd: z.number().optional(),
  })
  .passthrough();

const OhlcvCandleSchema = z
  .object({
    unixTime: z.number(),
    o: z.number(),
    h: z.number(),
    l: z.number(),
    c: z.number(),
    v: z.number().optional(),
    address: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

const HistoryPricePointSchema = z
  .object({
    unixTime: z.number(),
    value: z.number(),
    address: z.string().optional(),
  })
  .passthrough();

/* ------------------------------------------------------------------ */
/* 1. GET /defi/price — single token price                             */
/*    https://docs.birdeye.so/reference/get_defi-price                */
/* ------------------------------------------------------------------ */
export const GetPriceInput = z.object({
  address: AddressSchema,
  check_liquidity: z.number().optional(),
  include_liquidity: z.boolean().optional(),
});
export type GetPriceInput = z.infer<typeof GetPriceInput>;

export const GetPriceOutput = PricePointSchema;

export function getPrice(input: GetPriceInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/price", {
    input: GetPriceInput,
    output: GetPriceOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 2. GET /defi/multi_price — bulk price (comma list)                  */
/* ------------------------------------------------------------------ */
export const GetMultiPriceInput = z.object({
  list_address: z.union([z.array(AddressSchema), z.string()]),
  check_liquidity: z.number().optional(),
  include_liquidity: z.boolean().optional(),
});
export type GetMultiPriceInput = z.infer<typeof GetMultiPriceInput>;

export const GetMultiPriceOutput = z.record(z.string(), PricePointSchema.nullable());

export function getMultiPrice(input: GetMultiPriceInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/multi_price", {
    input: GetMultiPriceInput,
    output: GetMultiPriceOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 3. POST /defi/multi_price — bulk price (POST body, > GET limit)     */
/* ------------------------------------------------------------------ */
export const PostMultiPriceInput = z.object({
  list_address: z.array(AddressSchema).min(1).max(100),
  check_liquidity: z.number().optional(),
  include_liquidity: z.boolean().optional(),
});
export type PostMultiPriceInput = z.infer<typeof PostMultiPriceInput>;

export function postMultiPrice(
  input: PostMultiPriceInput,
  chain?: BirdeyeChain,
) {
  return birdeyePost("/defi/multi_price", {
    input: PostMultiPriceInput,
    output: GetMultiPriceOutput,
    body: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 4. GET /defi/historical_price_unix — price at unix timestamp        */
/*    https://docs.birdeye.so/reference/get_defi-historical-price-unix*/
/* ------------------------------------------------------------------ */
export const GetHistoricalPriceUnixInput = z.object({
  address: AddressSchema,
  unixtime: z.number().int(),
});
export type GetHistoricalPriceUnixInput = z.infer<
  typeof GetHistoricalPriceUnixInput
>;

export const GetHistoricalPriceUnixOutput = z
  .object({
    value: z.number(),
    updateUnixTime: z.number(),
    priceChange24h: z.number().optional(),
  })
  .passthrough();

export function getHistoricalPriceUnix(
  input: GetHistoricalPriceUnixInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/historical_price_unix", {
    input: GetHistoricalPriceUnixInput,
    output: GetHistoricalPriceUnixOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 5. GET /defi/history_price — historical price line                  */
/*    https://docs.birdeye.so/reference/get_defi-history-price        */
/* ------------------------------------------------------------------ */
export const GetHistoryPriceInput = z.object({
  address: AddressSchema,
  address_type: z.enum(["token", "pair"]).default("token").optional(),
  type: TimeframeSchema,
  time_from: z.number().int(),
  time_to: z.number().int(),
});
export type GetHistoryPriceInput = z.infer<typeof GetHistoryPriceInput>;

export const GetHistoryPriceOutput = z
  .object({
    items: z.array(HistoryPricePointSchema),
  })
  .passthrough();

export function getHistoryPrice(
  input: GetHistoryPriceInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/history_price", {
    input: GetHistoryPriceInput,
    output: GetHistoryPriceOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 6. GET /defi/price_volume/single                                    */
/*    https://docs.birdeye.so/reference/get_defi-price-volume-single  */
/* ------------------------------------------------------------------ */
export const GetPriceVolumeSingleInput = z.object({
  address: AddressSchema,
  type: z.enum(["1h", "2h", "4h", "8h", "24h"]).optional(),
});
export type GetPriceVolumeSingleInput = z.infer<
  typeof GetPriceVolumeSingleInput
>;

export const PriceVolumeSchema = z
  .object({
    price: z.number().optional(),
    updateUnixTime: z.number().optional(),
    updateHumanTime: z.string().optional(),
    volumeUSD: z.number().optional(),
    volumeChangePercent: z.number().optional(),
    priceChangePercent: z.number().optional(),
  })
  .passthrough();

export function getPriceVolumeSingle(
  input: GetPriceVolumeSingleInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/price_volume/single", {
    input: GetPriceVolumeSingleInput,
    output: PriceVolumeSchema,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 7. POST /defi/price_volume/multi                                    */
/* ------------------------------------------------------------------ */
export const PostPriceVolumeMultiInput = z.object({
  list_address: z.array(AddressSchema).min(1).max(50),
  type: z.enum(["1h", "2h", "4h", "8h", "24h"]).optional(),
});
export type PostPriceVolumeMultiInput = z.infer<
  typeof PostPriceVolumeMultiInput
>;

export const PostPriceVolumeMultiOutput = z.record(
  z.string(),
  PriceVolumeSchema,
);

export function postPriceVolumeMulti(
  input: PostPriceVolumeMultiInput,
  chain?: BirdeyeChain,
) {
  return birdeyePost("/defi/price_volume/multi", {
    input: PostPriceVolumeMultiInput,
    output: PostPriceVolumeMultiOutput,
    body: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 8. GET /defi/ohlcv — token OHLCV                                    */
/*    https://docs.birdeye.so/reference/get_defi-ohlcv                */
/* ------------------------------------------------------------------ */
export const GetOhlcvInput = z.object({
  address: AddressSchema,
  type: TimeframeSchema,
  time_from: z.number().int().optional(),
  time_to: z.number().int().optional(),
  currency: z.enum(["usd", "native", "pair"]).optional(),
});
export type GetOhlcvInput = z.infer<typeof GetOhlcvInput>;

export const OhlcvOutput = z
  .object({ items: z.array(OhlcvCandleSchema) })
  .passthrough();

export function getOhlcv(input: GetOhlcvInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/ohlcv", {
    input: GetOhlcvInput,
    output: OhlcvOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 9. GET /defi/ohlcv/pair                                             */
/* ------------------------------------------------------------------ */
export const GetOhlcvPairInput = z.object({
  address: AddressSchema,
  type: TimeframeSchema,
  time_from: z.number().int().optional(),
  time_to: z.number().int().optional(),
});
export type GetOhlcvPairInput = z.infer<typeof GetOhlcvPairInput>;

export function getOhlcvPair(input: GetOhlcvPairInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/ohlcv/pair", {
    input: GetOhlcvPairInput,
    output: OhlcvOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 10. GET /defi/ohlcv/base_quote                                      */
/* ------------------------------------------------------------------ */
export const GetOhlcvBaseQuoteInput = z.object({
  base_address: AddressSchema,
  quote_address: AddressSchema,
  type: TimeframeSchema,
  time_from: z.number().int().optional(),
  time_to: z.number().int().optional(),
});
export type GetOhlcvBaseQuoteInput = z.infer<typeof GetOhlcvBaseQuoteInput>;

export function getOhlcvBaseQuote(
  input: GetOhlcvBaseQuoteInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/ohlcv/base_quote", {
    input: GetOhlcvBaseQuoteInput,
    output: OhlcvOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 11. GET /defi/v3/ohlcv — v3 unified token OHLCV                     */
/*     https://docs.birdeye.so/reference/get_defi-v3-ohlcv            */
/* ------------------------------------------------------------------ */
export const GetOhlcvV3Input = z.object({
  address: AddressSchema,
  type: TimeframeSchema,
  time_from: z.number().int().optional(),
  time_to: z.number().int().optional(),
  currency: z.enum(["usd", "native", "pair"]).optional(),
});
export type GetOhlcvV3Input = z.infer<typeof GetOhlcvV3Input>;

export function getOhlcvV3(input: GetOhlcvV3Input, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/ohlcv", {
    input: GetOhlcvV3Input,
    output: OhlcvOutput,
    params: input,
    chain,
  });
}

/* ------------------------------------------------------------------ */
/* 12. GET /defi/v3/ohlcv/pair                                         */
/* ------------------------------------------------------------------ */
export const GetOhlcvPairV3Input = GetOhlcvPairInput;
export type GetOhlcvPairV3Input = z.infer<typeof GetOhlcvPairV3Input>;

export function getOhlcvPairV3(
  input: GetOhlcvPairV3Input,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/ohlcv/pair", {
    input: GetOhlcvPairV3Input,
    output: OhlcvOutput,
    params: input,
    chain,
  });
}
