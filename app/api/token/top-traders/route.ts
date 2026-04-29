import { NextResponse } from "next/server";
import { getTopTraders } from "@/lib/birdeye/cached";
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
  const offset = intParam(req, "offset", 0)!;
  const limit = intParam(req, "limit", 25)!;
  const time = (strParam(req, "time") ?? "24h") as
    | "1h"
    | "2h"
    | "4h"
    | "8h"
    | "24h";
  try {
    const data = await getTopTraders(
      {
        address,
        time_frame: time,
        sort_by: "PnL",
        sort_type: "desc",
        offset,
        limit,
      },
      chain as never,
    );
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
