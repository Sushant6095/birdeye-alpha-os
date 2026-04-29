import { NextResponse } from "next/server";
import { getTokenListV3 } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * "New listings" sources via Token List V3 with a sort_by hint.
 * Birdeye exposes new-listing detail through the WS new_listing topic;
 * for the Discover feed we surface freshly-listed tokens by recency.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const offset = intParam(req, "offset", 0)!;
  const limit = intParam(req, "limit", 20)!;
  try {
    const data = await getTokenListV3(
      {
        sort_by: "recent_listing_time",
        sort_type: "desc",
        offset,
        limit,
        min_liquidity: 5000,
      },
      chain as never,
    );
    return NextResponse.json({ data, chain, offset, limit });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
