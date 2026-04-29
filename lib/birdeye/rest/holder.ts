import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema, SortTypeSchema, TimeWindowSchema } from "../types/common";

const HolderItemSchema = z
  .object({
    owner: z.string().optional(),
    address: z.string().optional(),
    token_account: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    ui_amount: z.number().optional(),
    decimals: z.number().optional(),
    percentage: z.number().optional(),
  })
  .passthrough();

const HolderPageSchema = z
  .object({
    items: z.array(HolderItemSchema).optional(),
    total: z.number().optional(),
  })
  .passthrough();

/* 1. GET /defi/v3/token/holder — paginated holders */
export const GetTokenHolderInput = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetTokenHolderInput = z.infer<typeof GetTokenHolderInput>;
export function getTokenHolder(
  input: GetTokenHolderInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/holder", {
    input: GetTokenHolderInput,
    output: HolderPageSchema,
    params: input,
    chain,
  });
}

/* 2. GET /defi/v3/token/top_traders */
export const GetTopTradersInput = z.object({
  address: AddressSchema,
  time_frame: TimeWindowSchema.optional(),
  sort_by: z.enum(["volume", "trade", "PnL"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetTopTradersInput = z.infer<typeof GetTopTradersInput>;
export function getTopTraders(input: GetTopTradersInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/token/top_traders", {
    input: GetTopTradersInput,
    output: HolderPageSchema,
    params: input,
    chain,
  });
}

/* 3. GET /defi/v3/token/top_traders/list */
export function getTopTradersList(
  input: GetTopTradersInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/top_traders/list", {
    input: GetTopTradersInput,
    output: HolderPageSchema,
    params: input,
    chain,
  });
}

/* 4. GET /defi/v3/token/holder/distribution — distribution buckets */
export const GetHolderDistributionInput = z.object({
  address: AddressSchema,
});
export type GetHolderDistributionInput = z.infer<
  typeof GetHolderDistributionInput
>;
export const HolderDistributionOutput = z
  .object({
    address: z.string().optional(),
    holder_count: z.number().optional(),
    distribution: z.array(z.unknown()).optional(),
  })
  .passthrough();
export function getHolderDistribution(
  input: GetHolderDistributionInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/holder/distribution", {
    input: GetHolderDistributionInput,
    output: HolderDistributionOutput,
    params: input,
    chain,
  });
}

/* 5. GET /defi/v3/token/holder/active — active holders over a window */
export const GetActiveHoldersInput = z.object({
  address: AddressSchema,
  type: TimeWindowSchema.optional(),
});
export type GetActiveHoldersInput = z.infer<typeof GetActiveHoldersInput>;
export function getActiveHolders(
  input: GetActiveHoldersInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/token/holder/active", {
    input: GetActiveHoldersInput,
    output: HolderPageSchema,
    params: input,
    chain,
  });
}
