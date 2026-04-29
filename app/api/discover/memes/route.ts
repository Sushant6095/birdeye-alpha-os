import { NextResponse } from "next/server";
import { getMemeList } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const offset = intParam(req, "offset", 0)!;
  const limit = intParam(req, "limit", 30)!;
  try {
    const data = await getMemeList(
      {
        offset,
        limit,
        sort_by: "volume_24h_usd",
        sort_type: "desc",
      },
      chain as never,
    );
    return NextResponse.json({ data, chain, offset, limit });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
