import { NextResponse } from "next/server";
import { z } from "zod";
import { birdeyeGet } from "@/lib/birdeye/client";
import { chainOf, strParam } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const Output = z
  .object({
    items: z
      .array(
        z
          .object({
            unixTime: z.number().optional(),
            value: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

/**
 * 30-day net-worth sparkline. Birdeye's wallet-history endpoint isn't part
 * of our covered set, so we hit it directly and degrade to an empty series
 * if it isn't available on the configured plan.
 */
export async function GET(req: Request) {
  const chain = chainOf(req);
  const wallet = strParam(req, "wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  try {
    const data = await birdeyeGet("/v1/wallet/net_worth_chart", {
      output: Output,
      params: { wallet, range: "30d" },
      chain: chain as never,
    });
    return NextResponse.json({ data });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[wallet/networth-chart] unavailable:", (err as Error).message);
    }
    return NextResponse.json({ data: { items: [] }, unavailable: true });
  }
}
