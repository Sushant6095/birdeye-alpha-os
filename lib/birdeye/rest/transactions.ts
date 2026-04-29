import { z } from "zod";
import { birdeyeGet, birdeyePost } from "../client";
import { type BirdeyeChain } from "../types/chain";
import {
  AddressSchema,
  SortTypeSchema,
  TimeWindowSchema,
  TxTypeSchema,
} from "../types/common";

const TxItemSchema = z
  .object({
    txHash: z.string().optional(),
    blockUnixTime: z.number().optional(),
    blockNumber: z.number().optional(),
    side: z.string().optional(),
    source: z.string().optional(),
    base: z.unknown().optional(),
    quote: z.unknown().optional(),
    from: z.unknown().optional(),
    to: z.unknown().optional(),
    owner: z.string().optional(),
    volumeUsd: z.number().optional(),
  })
  .passthrough();

const TxPageSchema = z
  .object({
    items: z.array(TxItemSchema).optional(),
    has_next: z.boolean().optional(),
    next_cursor: z.string().nullish(),
    solana: z.array(TxItemSchema).optional(),
  })
  .passthrough();

/* 1. GET /defi/txs/token */
export const GetTxsTokenInput = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  tx_type: TxTypeSchema.optional(),
  sort_type: SortTypeSchema.optional(),
});
export type GetTxsTokenInput = z.infer<typeof GetTxsTokenInput>;
export function getTxsToken(input: GetTxsTokenInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/txs/token", {
    input: GetTxsTokenInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 2. GET /defi/txs/pair */
export const GetTxsPairInput = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  tx_type: TxTypeSchema.optional(),
  sort_type: SortTypeSchema.optional(),
});
export type GetTxsPairInput = z.infer<typeof GetTxsPairInput>;
export function getTxsPair(input: GetTxsPairInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/txs/pair", {
    input: GetTxsPairInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 3. GET /defi/txs/token/seek_by_time */
export const GetTxsTokenSeekByTimeInput = z.object({
  address: AddressSchema,
  before_time: z.number().int().optional(),
  after_time: z.number().int().optional(),
  tx_type: TxTypeSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type GetTxsTokenSeekByTimeInput = z.infer<
  typeof GetTxsTokenSeekByTimeInput
>;
export function getTxsTokenSeekByTime(
  input: GetTxsTokenSeekByTimeInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/txs/token/seek_by_time", {
    input: GetTxsTokenSeekByTimeInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 4. GET /defi/txs/pair/seek_by_time */
export const GetTxsPairSeekByTimeInput = z.object({
  address: AddressSchema,
  before_time: z.number().int().optional(),
  after_time: z.number().int().optional(),
  tx_type: TxTypeSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type GetTxsPairSeekByTimeInput = z.infer<
  typeof GetTxsPairSeekByTimeInput
>;
export function getTxsPairSeekByTime(
  input: GetTxsPairSeekByTimeInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/txs/pair/seek_by_time", {
    input: GetTxsPairSeekByTimeInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 5. GET /defi/v3/token/txs */
export const GetTokenTxsV3Input = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  tx_type: TxTypeSchema.optional(),
  sort_type: SortTypeSchema.optional(),
});
export type GetTokenTxsV3Input = z.infer<typeof GetTokenTxsV3Input>;
export function getTokenTxsV3(input: GetTokenTxsV3Input, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/token/txs", {
    input: GetTokenTxsV3Input,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 6. GET /defi/v3/pair/txs */
export const GetPairTxsV3Input = GetTokenTxsV3Input;
export type GetPairTxsV3Input = z.infer<typeof GetPairTxsV3Input>;
export function getPairTxsV3(input: GetPairTxsV3Input, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/pair/txs", {
    input: GetPairTxsV3Input,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 7. GET /defi/v3/token/txs/recent */
export const GetTokenTxsRecentInput = z.object({
  address: AddressSchema,
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetTokenTxsRecentInput = z.infer<typeof GetTokenTxsRecentInput>;
export function getTokenTxsRecent(
  input: GetTokenTxsRecentInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/txs/recent", {
    input: GetTokenTxsRecentInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 8. GET /defi/v3/pair/txs/recent */
export function getPairTxsRecent(
  input: GetTokenTxsRecentInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/pair/txs/recent", {
    input: GetTokenTxsRecentInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 9. GET /defi/v3/all-time/trades/single */
export const GetAllTimeTradesSingleInput = z.object({
  address: AddressSchema,
});
export type GetAllTimeTradesSingleInput = z.infer<
  typeof GetAllTimeTradesSingleInput
>;
export const AllTimeTradesSingleOutput = z
  .object({
    address: z.string(),
    total_trades: z.number().optional(),
    total_volume_usd: z.number().optional(),
  })
  .passthrough();
export function getAllTimeTradesSingle(
  input: GetAllTimeTradesSingleInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/all-time/trades/single", {
    input: GetAllTimeTradesSingleInput,
    output: AllTimeTradesSingleOutput,
    params: input,
    chain,
  });
}

/* 10. POST /defi/v3/all-time/trades/multiple */
export const PostAllTimeTradesMultipleInput = z.object({
  list_address: z.array(AddressSchema).min(1).max(20),
});
export type PostAllTimeTradesMultipleInput = z.infer<
  typeof PostAllTimeTradesMultipleInput
>;
export const AllTimeTradesMultipleOutput = z.record(
  z.string(),
  AllTimeTradesSingleOutput,
);
export function postAllTimeTradesMultiple(
  input: PostAllTimeTradesMultipleInput,
  chain?: BirdeyeChain,
) {
  return birdeyePost("/defi/v3/all-time/trades/multiple", {
    input: PostAllTimeTradesMultipleInput,
    output: AllTimeTradesMultipleOutput,
    body: input,
    chain,
  });
}

/* 11. GET /trader/txs/seek_by_time — wallet trader txs */
export const GetTraderTxsSeekByTimeInput = z.object({
  address: AddressSchema,
  before_time: z.number().int().optional(),
  after_time: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  tx_type: TxTypeSchema.optional(),
});
export type GetTraderTxsSeekByTimeInput = z.infer<
  typeof GetTraderTxsSeekByTimeInput
>;
export function getTraderTxsSeekByTime(
  input: GetTraderTxsSeekByTimeInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/txs/seek_by_time", {
    input: GetTraderTxsSeekByTimeInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 12. GET /trader/gainers-losers */
export const GetGainersLosersInput = z.object({
  type: TimeWindowSchema.optional(),
  sort_by: z.enum(["PnL", "volume", "trade"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetGainersLosersInput = z.infer<typeof GetGainersLosersInput>;
export const GainersLosersOutput = z
  .object({ items: z.array(z.unknown()).optional() })
  .passthrough();
export function getGainersLosers(
  input: GetGainersLosersInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/gainers-losers", {
    input: GetGainersLosersInput,
    output: GainersLosersOutput,
    params: input,
    chain,
  });
}

/* 13. GET /defi/v3/txs/recent — chain-wide recent txs */
export const GetTxsRecentInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  source: z.string().optional(),
});
export type GetTxsRecentInput = z.infer<typeof GetTxsRecentInput>;
export function getTxsRecent(
  input: GetTxsRecentInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/txs/recent", {
    input: GetTxsRecentInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 14. GET /defi/v3/large-trades — recent large trades */
export const GetLargeTradesInput = z.object({
  min_volume_usd: z.number().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetLargeTradesInput = z.infer<typeof GetLargeTradesInput>;
export function getLargeTrades(
  input: GetLargeTradesInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/large-trades", {
    input: GetLargeTradesInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 15. GET /defi/v3/token/large-trades — large trades for token */
export const GetTokenLargeTradesInput = z.object({
  address: AddressSchema,
  min_volume_usd: z.number().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetTokenLargeTradesInput = z.infer<typeof GetTokenLargeTradesInput>;
export function getTokenLargeTrades(
  input: GetTokenLargeTradesInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/large-trades", {
    input: GetTokenLargeTradesInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}

/* 16. GET /defi/v3/pair/large-trades — large trades for pair */
export const GetPairLargeTradesInput = GetTokenLargeTradesInput;
export type GetPairLargeTradesInput = z.infer<typeof GetPairLargeTradesInput>;
export function getPairLargeTrades(
  input: GetPairLargeTradesInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/pair/large-trades", {
    input: GetPairLargeTradesInput,
    output: TxPageSchema,
    params: input,
    chain,
  });
}
