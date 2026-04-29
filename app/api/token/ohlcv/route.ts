import { NextResponse } from "next/server";
import {
  getOhlcvV3,
  getHistoryPrice,
} from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Initial OHLCV for the chart. Falls back to /defi/history_price if v3 OHLCV
 * fails (some chains/pairs don't have v3 candles yet).
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  const type = (strParam(req, "type") ?? "1m") as
    | "1m"
    | "5m"
    | "15m"
    | "1H"
    | "4H"
    | "1D";
  const time_to = intParam(req, "to") ?? Math.floor(Date.now() / 1000);
  const time_from =
    intParam(req, "from") ?? time_to - secondsForType(type) * 200;

  try {
    const data = await getOhlcvV3(
      { address, type, time_from, time_to },
      chain as never,
    );
    return NextResponse.json({ source: "ohlcv_v3", data });
  } catch (err) {
    try {
      const fallback = await getHistoryPrice(
        { address, type, time_from, time_to },
        chain as never,
      );
      return NextResponse.json({ source: "history_price", data: fallback });
    } catch {
      return birdeyeErrorToResponse(err);
    }
  }
}

function secondsForType(type: string): number {
  switch (type) {
    case "1s":
    case "15s":
    case "30s":
      return 60;
    case "1m":
      return 60;
    case "5m":
      return 5 * 60;
    case "15m":
      return 15 * 60;
    case "30m":
      return 30 * 60;
    case "1H":
      return 60 * 60;
    case "4H":
      return 4 * 60 * 60;
    case "1D":
      return 24 * 60 * 60;
    default:
      return 60 * 60;
  }
}
