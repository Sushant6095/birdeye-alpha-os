import { NextResponse } from "next/server";
import {
  getWalletTokenList,
  getWalletPnLSummary,
} from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Token holder side-drawer profile: portfolio + 24h PnL summary.
 * Wires to "Holder Profile / Positions" in the spec via the closest endpoints
 * we cover (wallet token list + wallet PnL summary).
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  try {
    const [portfolioR, pnlR] = await Promise.allSettled([
      getWalletTokenList({ wallet }, chain as never),
      getWalletPnLSummary({ address: wallet, type: "24h" }, chain as never),
    ]);
    return NextResponse.json({
      portfolio:
        portfolioR.status === "fulfilled" ? portfolioR.value : null,
      pnl: pnlR.status === "fulfilled" ? pnlR.value : null,
    });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
