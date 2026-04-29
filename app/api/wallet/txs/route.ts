import { NextResponse } from "next/server";
import {
  getWalletTxList,
  getTraderTxsSeekByTime,
} from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 *  ?mode=history (default) → /v1/wallet/tx_list
 *  ?mode=token-trades&before=… → /trader/txs/seek_by_time
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const mode = strParam(req, "mode") ?? "history";
  const limit = intParam(req, "limit", 30)!;
  try {
    if (mode === "token-trades") {
      const before_time = intParam(req, "before");
      const after_time = intParam(req, "after");
      const data = await getTraderTxsSeekByTime(
        { address: wallet, before_time, after_time, limit },
        chain as never,
      );
      return NextResponse.json({ mode, data });
    }
    const data = await getWalletTxList(
      { wallet, limit, before: strParam(req, "before") },
      chain as never,
    );
    return NextResponse.json({ mode, data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
