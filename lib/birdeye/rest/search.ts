import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { SortTypeSchema } from "../types/common";

/* 1. GET /defi/v3/search — universal search (tokens, pairs, wallets) */
export const SearchInput = z.object({
  keyword: z.string().min(1),
  target: z
    .enum(["token", "market", "all", "wallet", "pair"])
    .optional(),
  sort_by: z.enum(["liquidity", "volume_24h_usd", "fdv", "marketcap"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  verify_token: z.boolean().optional(),
  markets: z.string().optional(),
  chain: z.string().optional(),
});
export type SearchInput = z.infer<typeof SearchInput>;

export const SearchOutput = z
  .object({
    items: z.array(z.unknown()).optional(),
  })
  .passthrough();

export function search(input: SearchInput, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/search", {
    input: SearchInput,
    output: SearchOutput,
    params: input,
    chain,
  });
}

/* 2. GET /defi/networks — legacy networks list (utility) */
export const GetLegacyNetworksInput = z.object({});
export type GetLegacyNetworksInput = z.infer<typeof GetLegacyNetworksInput>;
export const LegacyNetworksOutput = z
  .array(z.string())
  .or(
    z
      .object({ items: z.array(z.unknown()).optional() })
      .passthrough(),
  );
export function getLegacyNetworks() {
  return birdeyeGet("/defi/networks", {
    output: LegacyNetworksOutput,
  });
}
