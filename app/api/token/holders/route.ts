import { NextResponse } from "next/server";
import { getTokenHolder } from "@/lib/birdeye/cached";
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
  const limit = intParam(req, "limit", 50)!;
  try {
    const data = await getTokenHolder({ address, offset, limit }, chain as never);
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
