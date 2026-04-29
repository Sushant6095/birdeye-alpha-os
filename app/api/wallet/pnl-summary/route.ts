import { NextResponse } from "next/server";
import { getWalletPnLSummary } from "@/lib/birdeye/cached";
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
  const type = (strParam(req, "type") ?? "all") as
    | "1h"
    | "1d"
    | "1w"
    | "1m"
    | "1y"
    | "all";
  try {
    const data = await getWalletPnLSummary(
      { address: wallet, type },
      chain as never,
    );
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
