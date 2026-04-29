import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { SortTypeSchema, TimeWindowSchema } from "../types/common";

/* 1. GET /trader/smart-money/list — smart-money wallets ranking */
export const GetSmartMoneyListInput = z.object({
  type: TimeWindowSchema.optional(),
  sort_by: z.enum(["pnl", "volume", "trade", "win_rate"]).optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type GetSmartMoneyListInput = z.infer<typeof GetSmartMoneyListInput>;

export const SmartMoneyListOutput = z
  .object({
    items: z.array(z.unknown()).optional(),
    total: z.number().optional(),
  })
  .passthrough();

export function getSmartMoneyList(
  input: GetSmartMoneyListInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/trader/smart-money/list", {
    input: GetSmartMoneyListInput,
    output: SmartMoneyListOutput,
    params: input,
    chain,
  });
}
