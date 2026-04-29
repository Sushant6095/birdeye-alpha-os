import { z } from "zod";
import { birdeyeGet, birdeyePost } from "../client";
import { type BirdeyeChain } from "../types/chain";
import {
  AddressSchema,
  SortTypeSchema,
  TimeWindowSchema,
} from "../types/common";

const WalletTokenItemSchema = z
  .object({
    address: z.string(),
    decimals: z.number().optional(),
    balance: z.union([z.string(), z.number()]).optional(),
    uiAmount: z.number().optional(),
    chainId: z.string().optional(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    icon: z.string().optional(),
    logoURI: z.string().optional(),
    priceUsd: z.number().optional(),
    valueUsd: z.number().optional(),
  })
  .passthrough();

const WalletPortfolioSchema = z
  .object({
    wallet: z.string().optional(),
    totalUsd: z.number().optional(),
    items: z.array(WalletTokenItemSchema).optional(),
  })
  .passthrough();

/* 1. GET /v1/wallet/list_supported_chain */
export const ListSupportedChainInput = z.object({});
export type ListSupportedChainInput = z.infer<typeof ListSupportedChainInput>;
export const ListSupportedChainOutput = z.array(z.string()).or(z.unknown());
export function listSupportedChain() {
  return birdeyeGet("/v1/wallet/list_supported_chain", {
    output: ListSupportedChainOutput,
  });
}

/* 2. GET /v1/wallet/multichain_token_list */
export const GetMultichainTokenListInput = z.object({
  wallet: AddressSchema,
});
export type GetMultichainTokenListInput = z.infer<
  typeof GetMultichainTokenListInput
>;
export function getMultichainTokenList(input: GetMultichainTokenListInput) {
  return birdeyeGet("/v1/wallet/multichain_token_list", {
    input: GetMultichainTokenListInput,
    output: WalletPortfolioSchema,
    params: input,
  });
}

/* 3. GET /v1/wallet/token_list — single-chain portfolio */
export const GetWalletTokenListInput = z.object({
  wallet: AddressSchema,
});
export type GetWalletTokenListInput = z.infer<typeof GetWalletTokenListInput>;
export function getWalletTokenList(
  input: GetWalletTokenListInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/v1/wallet/token_list", {
    input: GetWalletTokenListInput,
    output: WalletPortfolioSchema,
    params: input,
    chain,
  });
}

/* 4. GET /v1/wallet/token_balance */
export const GetWalletTokenBalanceInput = z.object({
  wallet: AddressSchema,
  token_address: AddressSchema,
});
export type GetWalletTokenBalanceInput = z.infer<
  typeof GetWalletTokenBalanceInput
>;
export const WalletTokenBalanceOutput = WalletTokenItemSchema;
export function getWalletTokenBalance(
  input: GetWalletTokenBalanceInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/v1/wallet/token_balance", {
    input: GetWalletTokenBalanceInput,
    output: WalletTokenBalanceOutput,
    params: input,
    chain,
  });
}

/* 5. GET /v1/wallet/tx_list */
export const GetWalletTxListInput = z.object({
  wallet: AddressSchema,
  limit: z.number().int().min(1).max(100).optional(),
  before: z.string().optional(),
});
export type GetWalletTxListInput = z.infer<typeof GetWalletTxListInput>;
export const WalletTxListOutput = z
  .object({
    solana: z.array(z.unknown()).optional(),
    items: z.array(z.unknown()).optional(),
  })
  .passthrough();
export function getWalletTxList(
  input: GetWalletTxListInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/v1/wallet/tx_list", {
    input: GetWalletTxListInput,
    output: WalletTxListOutput,
    params: input,
    chain,
  });
}

/* 6. GET /v1/wallet/multichain_tx_list */
export const GetMultichainTxListInput = z.object({
  wallet: AddressSchema,
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetMultichainTxListInput = z.infer<typeof GetMultichainTxListInput>;
export function getMultichainTxList(input: GetMultichainTxListInput) {
  return birdeyeGet("/v1/wallet/multichain_tx_list", {
    input: GetMultichainTxListInput,
    output: WalletTxListOutput,
    params: input,
  });
}

/* 7. POST /v1/wallet/simulate */
export const PostWalletSimulateInput = z.object({
  wallet: AddressSchema,
  encoded_tx: z.string().optional(),
  transaction: z.unknown().optional(),
});
export type PostWalletSimulateInput = z.infer<typeof PostWalletSimulateInput>;
export const WalletSimulateOutput = z.unknown();
export function postWalletSimulate(
  input: PostWalletSimulateInput,
  chain?: BirdeyeChain,
) {
  return birdeyePost("/v1/wallet/simulate", {
    input: PostWalletSimulateInput,
    output: WalletSimulateOutput,
    body: input,
    chain,
  });
}

/* 8. GET /v1/wallet/networth — single chain */
export const GetWalletNetworthInput = z.object({
  wallet: AddressSchema,
});
export type GetWalletNetworthInput = z.infer<typeof GetWalletNetworthInput>;
export const WalletNetworthOutput = z
  .object({
    wallet: z.string().optional(),
    totalUsd: z.number().optional(),
    chainId: z.string().optional(),
  })
  .passthrough();
export function getWalletNetworth(
  input: GetWalletNetworthInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/v1/wallet/networth", {
    input: GetWalletNetworthInput,
    output: WalletNetworthOutput,
    params: input,
    chain,
  });
}

/* 9. GET /v1/wallet/multichain_networth */
export function getMultichainNetworth(input: GetWalletNetworthInput) {
  return birdeyeGet("/v1/wallet/multichain_networth", {
    input: GetWalletNetworthInput,
    output: WalletNetworthOutput,
    params: input,
  });
}

/* 10. GET /trader/wallet/pnl-summary */
export const GetWalletPnLSummaryInput = z.object({
  address: AddressSchema,
  type: TimeWindowSchema.optional(),
});
export type GetWalletPnLSummaryInput = z.infer<typeof GetWalletPnLSummaryInput>;
export const WalletPnLSummaryOutput = z
  .object({
    address: z.string().optional(),
    pnl: z.number().optional(),
    realized_pnl: z.number().optional(),
    unrealized_pnl: z.number().optional(),
    win_rate: z.number().optional(),
    trade_count: z.number().optional(),
    volume: z.number().optional(),
  })
  .passthrough();
export function getWalletPnLSummary(
  input: GetWalletPnLSummaryInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/wallet/pnl-summary", {
    input: GetWalletPnLSummaryInput,
    output: WalletPnLSummaryOutput,
    params: input,
    chain,
  });
}

/* 11. GET /trader/wallet/pnl-detail */
export const GetWalletPnLDetailInput = z.object({
  address: AddressSchema,
  type: TimeWindowSchema.optional(),
  sort_by: z.string().optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetWalletPnLDetailInput = z.infer<typeof GetWalletPnLDetailInput>;
export const WalletPnLDetailOutput = z
  .object({ items: z.array(z.unknown()).optional() })
  .passthrough();
export function getWalletPnLDetail(
  input: GetWalletPnLDetailInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/wallet/pnl-detail", {
    input: GetWalletPnLDetailInput,
    output: WalletPnLDetailOutput,
    params: input,
    chain,
  });
}

/* 12. GET /trader/wallet/positions */
export const GetWalletPositionsInput = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetWalletPositionsInput = z.infer<typeof GetWalletPositionsInput>;
export function getWalletPositions(
  input: GetWalletPositionsInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/wallet/positions", {
    input: GetWalletPositionsInput,
    output: WalletPnLDetailOutput,
    params: input,
    chain,
  });
}

/* 13. GET /trader/wallet/realized-pnl */
export const GetWalletRealizedPnLInput = GetWalletPnLDetailInput;
export type GetWalletRealizedPnLInput = z.infer<
  typeof GetWalletRealizedPnLInput
>;
export function getWalletRealizedPnL(
  input: GetWalletRealizedPnLInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/wallet/realized-pnl", {
    input: GetWalletRealizedPnLInput,
    output: WalletPnLDetailOutput,
    params: input,
    chain,
  });
}

/* 14. GET /trader/wallet/unrealized-pnl */
export function getWalletUnrealizedPnL(
  input: GetWalletPnLDetailInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/wallet/unrealized-pnl", {
    input: GetWalletPnLDetailInput,
    output: WalletPnLDetailOutput,
    params: input,
    chain,
  });
}

/* 15. GET /trader/wallet/holdings */
export const GetWalletHoldingsInput = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetWalletHoldingsInput = z.infer<typeof GetWalletHoldingsInput>;
export function getWalletHoldings(
  input: GetWalletHoldingsInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/wallet/holdings", {
    input: GetWalletHoldingsInput,
    output: WalletPortfolioSchema,
    params: input,
    chain,
  });
}
