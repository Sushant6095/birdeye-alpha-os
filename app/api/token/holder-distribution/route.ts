import { NextResponse } from "next/server";
import { getHolderDistribution } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  try {
    const data = await getHolderDistribution({ address }, chain as never);
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
