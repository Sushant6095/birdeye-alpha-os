import { NextResponse } from "next/server";
import { getWalletPnLDetail } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const offset = intParam(req, "offset", 0)!;
  const limit = intParam(req, "limit", 50)!;
  const sortBy = strParam(req, "sortBy") ?? "realized_pnl";
  const sortType = (strParam(req, "sortType") ?? "desc") as "asc" | "desc";
  const type = (strParam(req, "type") ?? "all") as
    | "1h" | "1d" | "1w" | "1m" | "1y" | "all";
  try {
    const data = await getWalletPnLDetail(
      {
        address: wallet,
        type,
        sort_by: sortBy,
        sort_type: sortType,
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
