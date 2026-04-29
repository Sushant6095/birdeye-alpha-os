import { NextResponse } from "next/server";
import { getTransfersWallet } from "@/lib/birdeye/cached";
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
  const limit = intParam(req, "limit", 100)!;
  const tokenAddress = strParam(req, "token");
  try {
    const data = await getTransfersWallet(
      {
        wallet,
        offset,
        limit,
        ...(tokenAddress ? { token_address: tokenAddress } : {}),
      },
      chain as never,
    );
    const items = ((data as { items?: unknown[] })?.items ?? []) as Array<
      Record<string, unknown>
    >;
    let totalIn = 0;
    let totalOut = 0;
    let inCount = 0;
    let outCount = 0;
    for (const it of items) {
      const from = String(it["from"] ?? "").toLowerCase();
      const to = String(it["to"] ?? "").toLowerCase();
      const amt = Number(it["uiAmount"] ?? it["amount"] ?? 0);
      if (!Number.isFinite(amt)) continue;
      if (to === wallet.toLowerCase()) {
        totalIn += amt;
        inCount++;
      } else if (from === wallet.toLowerCase()) {
        totalOut += amt;
        outCount++;
      }
    }
    return NextResponse.json({
      data,
      totals: { totalIn, totalOut, inCount, outCount, sample: items.length },
    });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
