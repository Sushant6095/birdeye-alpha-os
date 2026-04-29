import { NextResponse } from "next/server";
import { getTokenListV3, getTokenListScroll } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const cursor = strParam(req, "cursor");
  const limit = intParam(req, "limit", 30)!;
  try {
    if (cursor) {
      const data = await getTokenListScroll(
        { cursor, limit, sort_by: "price_change_24h_percent", sort_type: "desc" },
        chain as never,
      );
      return NextResponse.json({ data, chain, mode: "scroll" });
    }
    const data = await getTokenListV3(
      {
        sort_by: "price_change_24h_percent",
        sort_type: "desc",
        offset: intParam(req, "offset", 0)!,
        limit,
        min_volume_24h_usd: 50_000,
      },
      chain as never,
    );
    return NextResponse.json({ data, chain, mode: "page" });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
