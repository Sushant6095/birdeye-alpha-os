import { NextResponse } from "next/server";
import { getOhlcvBaseQuote } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const base = strParam(req, "base");
  const quote = strParam(req, "quote");
  if (!base || !quote)
    return NextResponse.json({ error: "base and quote required" }, { status: 400 });
  const type = (strParam(req, "type") ?? "1m") as
    | "1m" | "5m" | "15m" | "1H" | "4H" | "1D";
  const time_to = intParam(req, "to") ?? Math.floor(Date.now() / 1000);
  const time_from =
    intParam(req, "from") ??
    time_to - 200 * (type === "1m" ? 60 : type === "5m" ? 300 : 3600);
  try {
    const data = await getOhlcvBaseQuote(
      { base_address: base, quote_address: quote, type, time_from, time_to },
      chain as never,
    );
    return NextResponse.json({ source: "ohlcv_base_quote", data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
