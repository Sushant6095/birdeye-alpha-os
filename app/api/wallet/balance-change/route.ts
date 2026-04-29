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
 * Per-token balance change history, derived from /v3/transfers/wallet
 * filtered to a single token. Computes a running balance over the most
 * recent N transfers.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  const token = strParam(req, "token");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const limit = intParam(req, "limit", 100)!;
  try {
    const data = await getTransfersWallet(
      { wallet, limit, token_address: token },
      chain as never,
    );
    const items = ((data as { items?: unknown[] })?.items ?? []) as Array<
      Record<string, unknown>
    >;
    // ascending → running balance
    const sorted = [...items].sort(
      (a, b) =>
        Number(a["blockUnixTime"] ?? 0) - Number(b["blockUnixTime"] ?? 0),
    );
    let running = 0;
    const series = sorted.map((t) => {
      const amt = Number(t["uiAmount"] ?? 0);
      const to = String(t["to"] ?? "").toLowerCase();
      const direction = to === wallet.toLowerCase() ? 1 : -1;
      running += direction * amt;
      return {
        unixTime: Number(t["blockUnixTime"] ?? 0),
        balance: running,
        direction,
        amount: amt,
        txHash: String(t["txHash"] ?? ""),
      };
    });
    return NextResponse.json({ wallet, token, series });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
