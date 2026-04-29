import { NextResponse } from "next/server";
import { getMemeList } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, string> = {
  virality: "volume_24h_usd",
  age: "recent_listing_time",
  marketcap: "market_cap",
  holders: "holder",
  trades: "trade_24h_count",
};

export async function GET(req: Request) {
  const chain = chainOf(req);
  const sortKey = strParam(req, "sort") ?? "virality";
  const sort_by = SORT_MAP[sortKey] ?? "volume_24h_usd";
  const sort_type =
    sortKey === "age"
      ? "desc"
      : (strParam(req, "dir") as "asc" | "desc" | undefined) ?? "desc";
  const offset = intParam(req, "offset", 0)!;
  const limit = intParam(req, "limit", 30)!;
  const source = strParam(req, "source");
  try {
    const data = await getMemeList(
      {
        sort_by,
        sort_type,
        offset,
        limit,
        ...(source ? { source } : {}),
      },
      chain as never,
    );
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
