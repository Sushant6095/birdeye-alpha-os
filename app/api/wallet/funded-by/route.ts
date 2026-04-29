import { NextResponse } from "next/server";
import { getTransfersWallet } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  intParam,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Approximation of "First Tx Funded": pull the wallet's transfers (oldest
 * first), pick the earliest *incoming* one, and surface its sender as the
 * funding origin. Returns up to `depth` ancestor wallets when available
 * (chain-of-custody preview).
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const depth = Math.min(5, intParam(req, "depth", 3)!);

  try {
    const chainOfCustody: Array<{
      wallet: string;
      from: string;
      amount: number;
      blockUnixTime: number;
      txHash: string;
    }> = [];
    let cursor = wallet;
    for (let i = 0; i < depth; i++) {
      const data = await getTransfersWallet(
        { wallet: cursor, limit: 50 },
        chain as never,
      );
      const items = ((data as { items?: unknown[] })?.items ?? []) as Array<
        Record<string, unknown>
      >;
      // sort ascending by time, find earliest incoming
      const sorted = [...items].sort(
        (a, b) =>
          Number(a["blockUnixTime"] ?? 0) - Number(b["blockUnixTime"] ?? 0),
      );
      const earliestIn = sorted.find(
        (t) =>
          String(t["to"] ?? "").toLowerCase() === cursor.toLowerCase() &&
          String(t["from"] ?? "").length > 0,
      );
      if (!earliestIn) break;
      const from = String(earliestIn["from"] ?? "");
      chainOfCustody.push({
        wallet: cursor,
        from,
        amount: Number(earliestIn["uiAmount"] ?? 0),
        blockUnixTime: Number(earliestIn["blockUnixTime"] ?? 0),
        txHash: String(earliestIn["txHash"] ?? ""),
      });
      cursor = from;
      if (!cursor) break;
    }
    return NextResponse.json({
      wallet,
      origin: chainOfCustody[chainOfCustody.length - 1]?.from ?? null,
      chain: chainOfCustody,
    });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
