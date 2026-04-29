import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { AddressSchema } from "../types/common";

/* 1. GET /defi/token_security — security checks for a token */
export const GetTokenSecurityInput = z.object({
  address: AddressSchema,
});
export type GetTokenSecurityInput = z.infer<typeof GetTokenSecurityInput>;

export const TokenSecurityOutput = z
  .object({
    address: z.string().optional(),
    creatorAddress: z.string().optional(),
    creationTime: z.number().optional(),
    creationSlot: z.number().optional(),
    mintAuthority: z.string().nullish(),
    freezeAuthority: z.string().nullish(),
    isToken2022: z.boolean().optional(),
    transferFeeEnable: z.boolean().nullish(),
    nonTransferable: z.boolean().nullish(),
    top10HolderBalance: z.number().optional(),
    top10HolderPercent: z.number().optional(),
    top10UserBalance: z.number().optional(),
    top10UserPercent: z.number().optional(),
    isTrueToken: z.boolean().nullish(),
    totalSupply: z.union([z.string(), z.number()]).optional(),
    preMarketHolder: z.array(z.unknown()).optional(),
    lockInfo: z.unknown().optional(),
    freezeable: z.boolean().nullish(),
    ownerAddress: z.string().nullish(),
    ownerPercentage: z.number().nullish(),
    ownerBalance: z.number().nullish(),
  })
  .passthrough();

export function getTokenSecurity(
  input: GetTokenSecurityInput,
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/token_security", {
    input: GetTokenSecurityInput,
    output: TokenSecurityOutput,
    params: input,
    chain,
  });
}
