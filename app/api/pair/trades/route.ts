import { NextResponse } from "next/server";
import { getPairTxsV3, getTxsPairSeekByTime } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  const mode = strParam(req, "mode") ?? "recent";
  const limit = intParam(req, "limit", 30)!;
  try {
    if (mode === "seek") {
      const before_time = intParam(req, "before");
      const after_time = intParam(req, "after");
      const data = await getTxsPairSeekByTime(
        { address, before_time, after_time, limit },
        chain as never,
      );
      return NextResponse.json({ mode, data });
    }
    const offset = intParam(req, "offset", 0)!;
    const data = await getPairTxsV3(
      { address, offset, limit, sort_type: "desc" },
      chain as never,
    );
    return NextResponse.json({ mode, data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
