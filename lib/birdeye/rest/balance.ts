import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema, SortTypeSchema } from "../types/common";

const TransferItemSchema = z
  .object({
    txHash: z.string().optional(),
    blockUnixTime: z.number().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    uiAmount: z.number().optional(),
    address: z.string().optional(),
    decimals: z.number().optional(),
  })
  .passthrough();

const TransferPageSchema = z
  .object({
    items: z.array(TransferItemSchema).optional(),
    total: z.number().optional(),
    has_next: z.boolean().optional(),
  })
  .passthrough();

const BalanceItemSchema = z
  .object({
    address: z.string(),
    amount: z.union([z.string(), z.number()]).optional(),
    uiAmount: z.number().optional(),
    decimals: z.number().optional(),
    valueUsd: z.number().optional(),
  })
  .passthrough();

/* 1. GET /defi/v3/balance/token — single token balance for wallet */
export const GetBalanceTokenInput = z.object({
  wallet: AddressSchema,
  token_address: AddressSchema,
});
export type GetBalanceTokenInput = z.infer<typeof GetBalanceTokenInput>;
export function getBalanceToken(
  input: GetBalanceTokenInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/balance/token", {
    input: GetBalanceTokenInput,
    output: BalanceItemSchema,
    params: input,
    chain,
  });
}

/* 2. GET /defi/v3/balance/wallet — full wallet balances */
export const GetBalanceWalletInput = z.object({
  wallet: AddressSchema,
});
export type GetBalanceWalletInput = z.infer<typeof GetBalanceWalletInput>;
export const BalanceWalletOutput = z
  .object({
    wallet: z.string().optional(),
    items: z.array(BalanceItemSchema).optional(),
    totalUsd: z.number().optional(),
  })
  .passthrough();
export function getBalanceWallet(
  input: GetBalanceWalletInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/balance/wallet", {
    input: GetBalanceWalletInput,
    output: BalanceWalletOutput,
    params: input,
    chain,
  });
}

/* 3. GET /defi/v3/balance/multi — bulk balance lookup */
export const GetBalanceMultiInput = z.object({
  wallet: AddressSchema,
  list_address: z.union([z.array(AddressSchema), z.string()]),
});
export type GetBalanceMultiInput = z.infer<typeof GetBalanceMultiInput>;
export const BalanceMultiOutput = z.record(z.string(), BalanceItemSchema);
export function getBalanceMulti(
  input: GetBalanceMultiInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/balance/multi", {
    input: GetBalanceMultiInput,
    output: BalanceMultiOutput,
    params: input,
    chain,
  });
}

/* 4. GET /defi/v3/transfers/token — transfers of a token */
export const GetTransfersTokenInput = z.object({
  address: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort_type: SortTypeSchema.optional(),
});
export type GetTransfersTokenInput = z.infer<typeof GetTransfersTokenInput>;
export function getTransfersToken(
  input: GetTransfersTokenInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/transfers/token", {
    input: GetTransfersTokenInput,
    output: TransferPageSchema,
    params: input,
    chain,
  });
}

/* 5. GET /defi/v3/transfers/wallet — transfers for a wallet */
export const GetTransfersWalletInput = z.object({
  wallet: AddressSchema,
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  token_address: AddressSchema.optional(),
});
export type GetTransfersWalletInput = z.infer<typeof GetTransfersWalletInput>;
export function getTransfersWallet(
  input: GetTransfersWalletInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/transfers/wallet", {
    input: GetTransfersWalletInput,
    output: TransferPageSchema,
    params: input,
    chain,
  });
}

/* 6. GET /defi/v3/transfers/recent — chain-wide recent transfers */
export const GetTransfersRecentInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetTransfersRecentInput = z.infer<typeof GetTransfersRecentInput>;
export function getTransfersRecent(
  input: GetTransfersRecentInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/transfers/recent", {
    input: GetTransfersRecentInput,
    output: TransferPageSchema,
    params: input,
    chain,
  });
}

/* 7. GET /defi/v3/transfers/multi — multi-token transfer lookup */
export const GetTransfersMultiInput = z.object({
  wallet: AddressSchema.optional(),
  list_address: z.union([z.array(AddressSchema), z.string()]),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetTransfersMultiInput = z.infer<typeof GetTransfersMultiInput>;
export function getTransfersMulti(
  input: GetTransfersMultiInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/transfers/multi", {
    input: GetTransfersMultiInput,
    output: TransferPageSchema,
    params: input,
    chain,
  });
}
