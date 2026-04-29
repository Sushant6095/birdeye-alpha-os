import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";

/* 1. GET /defi/v3/networks — supported networks list */
export const GetNetworksInput = z.object({});
export type GetNetworksInput = z.infer<typeof GetNetworksInput>;
export const NetworksOutput = z
  .object({
    items: z.array(z.unknown()).optional(),
  })
  .passthrough()
  .or(z.array(z.unknown()));
export function getNetworks() {
  return birdeyeGet("/defi/v3/networks", {
    output: NetworksOutput,
  });
}

/* 2. GET /defi/v3/blockchain/stats — chain-level stats */
export const GetBlockchainStatsInput = z.object({});
export type GetBlockchainStatsInput = z.infer<typeof GetBlockchainStatsInput>;
export const BlockchainStatsOutput = z
  .object({
    chain: z.string().optional(),
    block_height: z.number().optional(),
    last_block_time: z.number().optional(),
    daily_volume_usd: z.number().optional(),
  })
  .passthrough();
export function getBlockchainStats(chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/blockchain/stats", {
    output: BlockchainStatsOutput,
    chain,
  });
}
