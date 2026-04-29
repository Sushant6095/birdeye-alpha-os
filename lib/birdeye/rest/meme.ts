import { z } from "zod";
import { birdeyeGet } from "../client";
import { type BirdeyeChain } from "../types/chain";
import { SortTypeSchema } from "../types/common";

const MemeListPageSchema = z
  .object({
    items: z.array(z.unknown()).optional(),
    total: z.number().optional(),
    has_next: z.boolean().optional(),
  })
  .passthrough();

/* 1. GET /defi/v3/meme/list — meme tokens list */
export const GetMemeListInput = z.object({
  sort_by: z.string().optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  source: z.string().optional(),
  graduated: z.boolean().optional(),
});
export type GetMemeListInput = z.infer<typeof GetMemeListInput>;
export function getMemeList(input: GetMemeListInput = {}, chain?: BirdeyeChain) {
  return birdeyeGet("/defi/v3/meme/list", {
    input: GetMemeListInput,
    output: MemeListPageSchema,
    params: input,
    chain,
  });
}

/* 2. GET /defi/v3/meme/trending — trending meme tokens */
export const GetMemeTrendingInput = z.object({
  sort_by: z.string().optional(),
  sort_type: SortTypeSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type GetMemeTrendingInput = z.infer<typeof GetMemeTrendingInput>;
export function getMemeTrending(
  input: GetMemeTrendingInput = {},
  chain?: BirdeyeChain,
) {
  return birdeyeGet("/defi/v3/meme/trending", {
    input: GetMemeTrendingInput,
    output: MemeListPageSchema,
    params: input,
    chain,
  });
}
