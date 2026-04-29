import { NextResponse } from "next/server";
import {
  getTokenTxsV3,
  getTokenLargeTrades,
  getTxsTokenSeekByTime,
} from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Token trades. Modes:
 *   ?mode=recent         → /defi/v3/token/txs (default)
 *   ?mode=whales         → /defi/v3/token/large-trades  (with min_volume_usd)
 *   ?mode=seek&before=N  → /defi/txs/token/seek_by_time (scroll-back)
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  const mode = (strParam(req, "mode") ?? "recent") as
    | "recent"
    | "whales"
    | "seek";
  const limit = intParam(req, "limit", 30)!;
  try {
    if (mode === "whales") {
      const data = await getTokenLargeTrades(
        { address, min_volume_usd: intParam(req, "minUsd", 10_000)!, limit },
        chain as never,
      );
      return NextResponse.json({ mode, data });
    }
    if (mode === "seek") {
      const before_time = intParam(req, "before");
      const after_time = intParam(req, "after");
      const data = await getTxsTokenSeekByTime(
        { address, before_time, after_time, limit },
        chain as never,
      );
      return NextResponse.json({ mode, data });
    }
    const offset = intParam(req, "offset", 0)!;
    const data = await getTokenTxsV3(
      { address, offset, limit, sort_type: "desc" },
      chain as never,
    );
    return NextResponse.json({ mode, data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
