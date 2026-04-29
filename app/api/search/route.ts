import { NextResponse } from "next/server";
import { search } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const keyword = strParam(req, "q") ?? strParam(req, "keyword");
  if (!keyword) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
  const limit = intParam(req, "limit", 8)!;
  const target = (strParam(req, "target") as
    | "token"
    | "market"
    | "all"
    | "wallet"
    | "pair"
    | undefined) ?? "all";
  try {
    const data = await search({ keyword, target, limit }, chain as never);
    return NextResponse.json({ chain, keyword, items: (data as { items?: unknown[] })?.items ?? data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
