import { NextResponse } from "next/server";
import { getTokenLargeTrades } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Per-token whale history. Powers the "previous N whale buys for this token"
 * context line that shows up next to a fresh whale alert.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  const minUsd = intParam(req, "minUsd", 10_000)!;
  const limit = intParam(req, "limit", 25)!;
  try {
    const data = await getTokenLargeTrades(
      { address, min_volume_usd: minUsd, limit },
      chain as never,
    );
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
