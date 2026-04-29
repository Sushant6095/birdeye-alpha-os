import { NextResponse } from "next/server";
import { getPriceVolumeSingle } from "@/lib/birdeye/cached";
import {
  birdeyeErrorToResponse,
  chainOf,
  strParam,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const WINDOWS = ["1h", "2h", "4h", "8h", "24h"] as const;

/** Returns price/volume change across 1h/4h/8h/24h windows in parallel. */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const address = strParam(req, "address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  try {
    const results = await Promise.allSettled(
      WINDOWS.map((w) =>
        getPriceVolumeSingle({ address, type: w }, chain as never),
      ),
    );
    const out: Record<string, unknown> = {};
    WINDOWS.forEach((w, i) => {
      const r = results[i];
      out[w] = r && r.status === "fulfilled" ? r.value : null;
    });
    return NextResponse.json({ windows: out });
  } catch (err) {
    return birdeyeErrorToResponse(err);
  }
}
