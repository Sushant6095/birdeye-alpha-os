import { NextResponse } from "next/server";
import { getTokenTrending } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const offset = intParam(req, "offset", 0)!;
  // Birdeye /defi/token_trending caps limit at 20.
  const limit = Math.min(intParam(req, "limit", 20)!, 20);
  try {
    const data = await getTokenTrending({ offset, limit }, chain as never);
    return NextResponse.json({ data, chain, offset, limit });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
