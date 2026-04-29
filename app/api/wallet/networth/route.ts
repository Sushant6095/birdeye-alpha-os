import { NextResponse } from "next/server";
import { getWalletNetworth } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  try {
    const data = await getWalletNetworth({ wallet }, chain as never);
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
