import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

const DEFAULT_TOKEN: Record<string, string> = {
  solana: "So11111111111111111111111111111111111111112",
  ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  base: "0x4200000000000000000000000000000000000006",
};

export const dynamic = "force-dynamic";

/**
 * "By DEX" surfaces all markets for a given token, grouped by DEX source.
 * Defaults to the chain's wrapped native token if `address` is not supplied.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address") ?? DEFAULT_TOKEN[chain] ?? DEFAULT_TOKEN.solana!;
  const offset = intParam(req, "offset", 0)!;
  const limit = intParam(req, "limit", 50)!;
  try {
    const data = await getMarkets(
      {
        address,
        sort_by: "liquidity",
        sort_type: "desc",
        offset,
        limit,
      },
      chain as never,
    );
    const items =
      ((data as { items?: unknown[] })?.items as Record<string, unknown>[]) ?? [];
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const it of items) {
      const dex = String(it["source"] ?? it["dex"] ?? "unknown");
      (groups[dex] ??= []).push(it);
    }
    return NextResponse.json({ chain, address, groups, total: items.length });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
