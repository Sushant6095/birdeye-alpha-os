import { NextResponse } from "next/server";
import { getWalletTokenBalance } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  const token = strParam(req, "token");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  try {
    const data = await getWalletTokenBalance(
      { wallet, token_address: token },
      chain as never,
    );
    return NextResponse.json({ data });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
