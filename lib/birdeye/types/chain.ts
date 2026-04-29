import { z } from "zod";

/**
 * Birdeye supported chains. Sent via `x-chain` header.
 * Source: https://docs.birdeye.so/reference/list-supported-chain
 */
export const BirdeyeChainSchema = z.enum([
  "solana",
  "ethereum",
  "arbitrum",
  "avalanche",
  "bsc",
  "optimism",
  "polygon",
  "base",
  "zksync",
  "sui",
  "ronin",
  "linea",
  "sei",
  "monad",
  "berachain",
  "abstract",
  "hyperliquid",
]);

export type BirdeyeChain = z.infer<typeof BirdeyeChainSchema>;

export const DEFAULT_CHAIN: BirdeyeChain = "solana";
