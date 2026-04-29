import { NextResponse } from "next/server";
import {
  getOhlcvPairV3,
  getOhlcvPair,
} from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Pair candles. V3 first, legacy /defi/ohlcv/pair as fallback. Both run
 * through the cached client so a hot pair pays zero credits on repeats.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  const type = (strParam(req, "type") ?? "1m") as
    | "1m" | "5m" | "15m" | "1H" | "4H" | "1D";
  const time_to = intParam(req, "to") ?? Math.floor(Date.now() / 1000);
  const time_from =
    intParam(req, "from") ?? time_to - secondsForType(type) * 200;
  try {
    const data = await getOhlcvPairV3(
      { address, type, time_from, time_to },
      chain as never,
    );
    return NextResponse.json({ source: "ohlcv_pair_v3", data });
  } catch (err) {
    try {
      const fallback = await getOhlcvPair(
        { address, type, time_from, time_to },
        chain as never,
      );
      return NextResponse.json({ source: "ohlcv_pair_legacy", data: fallback });
    } catch {
      return birdeyeErrorToResponse(err);
    }
  }
}

function secondsForType(t: string): number {
  switch (t) {
    case "1m": return 60;
    case "5m": return 300;
    case "15m": return 900;
    case "1H": return 3600;
    case "4H": return 14_400;
    case "1D": return 86_400;
    default: return 3600;
  }
}
