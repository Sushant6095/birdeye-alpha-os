import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema, SortTypeSchema } from "../types/common";

/* 1. GET /defi/token_creation_info — creation info for a token */
export const GetTokenCreationInfoInput = z.object({
  address: AddressSchema,
});
export type GetTokenCreationInfoInput = z.infer<
  typeof GetTokenCreationInfoInput
>;
export const TokenCreationInfoOutput = z
  .object({
    txHash: z.string().optional(),
    slot: z.number().optional(),
    tokenAddress: z.string().optional(),
    decimals: z.number().optional(),
    owner: z.string().optional(),
    blockUnixTime: z.number().optional(),
    blockHumanTime: z.string().optional(),
  })
  .passthrough();
export function getTokenCreationInfo(
  input: GetTokenCreationInfoInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/token_creation_info", {
    input: GetTokenCreationInfoInput,
    output: TokenCreationInfoOutput,
    params: input,
    chain,
  });
}

/* 2. GET /defi/token_trending — trending tokens list */
export const GetTokenTrendingInput = z.object({
  sort_by: z.enum(["rank", "volume24hUSD", "liquidity"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});
export type GetTokenTrendingInput = z.infer<typeof GetTokenTrendingInput>;
export const TokenTrendingOutput = z
  .object({
    updateUnixTime: z.number().optional(),
    tokens: z.array(z.unknown()).optional(),
    items: z.array(z.unknown()).optional(),
    total: z.number().optional(),
  })
  .passthrough();
export function getTokenTrending(
  input: GetTokenTrendingInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/token_trending", {
    input: GetTokenTrendingInput,
    output: TokenTrendingOutput,
    params: input,
    chain,
  });
}
