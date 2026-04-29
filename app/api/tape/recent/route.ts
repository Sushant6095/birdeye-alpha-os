import { NextResponse } from "next/server";
import { getTxsRecent, getLargeTrades } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Chain-wide recent trades for the tape.
 *  ?minUsd=… switches to /defi/v3/large-trades for size-filtered backfill.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const limit = intParam(req, "limit", 50)!;
  const minUsd = intParam(req, "minUsd");
  const source = strParam(req, "source");
  try {
    if (minUsd && minUsd > 0) {
      const data = await getLargeTrades(
        { min_volume_usd: minUsd, limit },
        chain as never,
      );
      return NextResponse.json({ mode: "large", data });
    }
    const data = await getTxsRecent(
      { limit, ...(source ? { source } : {}) },
      chain as never,
    );
    return NextResponse.json({ mode: "recent", data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
