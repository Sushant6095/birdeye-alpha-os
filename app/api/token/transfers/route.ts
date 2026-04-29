import { NextResponse } from "next/server";
import { getTransfersToken } from "@/lib/birdeye/cached";
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
    const data = await getTransfersToken(
      { address, offset, limit, sort_type: "desc" },
      chain as never,
    );
    const items =
      ((data as { items?: unknown[] })?.items as unknown[]) ?? [];
    const total =
      (data as { total?: number })?.total ?? items.length;
    return NextResponse.json({ data, items, total });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
