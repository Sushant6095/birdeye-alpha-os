import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema } from "../types/common";

/* 1. GET /defi/v3/all-time/holders/single — all-time holder count for token */
export const GetAllTimeHoldersSingleInput = z.object({
  address: AddressSchema,
});
export type GetAllTimeHoldersSingleInput = z.infer<
  typeof GetAllTimeHoldersSingleInput
>;
export const AllTimeHoldersSingleOutput = z
  .object({
    address: z.string().optional(),
    total_unique_holders: z.number().optional(),
    current_holders: z.number().optional(),
  })
  .passthrough();
export function getAllTimeHoldersSingle(
  input: GetAllTimeHoldersSingleInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/all-time/holders/single", {
    input: GetAllTimeHoldersSingleInput,
    output: AllTimeHoldersSingleOutput,
    params: input,
    chain,
  });
}

/* 2. GET /defi/v3/history/price — historical price (v3 variant) */
export const GetHistoryPriceV3Input = z.object({
  address: AddressSchema,
  type: z.string(),
  time_from: z.number().int(),
  time_to: z.number().int(),
});
export type GetHistoryPriceV3Input = z.infer<typeof GetHistoryPriceV3Input>;
export const HistoryPriceV3Output = z
  .object({ items: z.array(z.unknown()).optional() })
  .passthrough();
export function getHistoryPriceV3(
  input: GetHistoryPriceV3Input,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/history/price", {
    input: GetHistoryPriceV3Input,
    output: HistoryPriceV3Output,
    params: input,
    chain,
  });
}
