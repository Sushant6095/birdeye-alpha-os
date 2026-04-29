import { NextResponse } from "next/server";
import { getBlockchainStats } from "@/lib/birdeye/cached";
import { chainOf } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Latest block height for the "data fresh as of block #X" indicator.
 * Polled every 5s by the Trade Tape.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  try {
    const data = await getBlockchainStats(chain as never);
    const d = data as Record<string, unknown>;
    return NextResponse.json({
      block:
        Number(d["block_height"] ?? d["latestBlock"] ?? d["blockNumber"]) ||
        null,
      lastBlockTime: Number(d["last_block_time"] ?? d["lastBlockTime"]) || null,
      raw: data,
    });
  } catch (err) {
    return NextResponse.json(
      { block: null, error: (err as Error).message },
      { status: 200 },
    );
  }
}
