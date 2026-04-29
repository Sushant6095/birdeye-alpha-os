import { NextResponse } from "next/server";
import {
  getAllTimeTradesSingle,
  getPriceVolumeSingle,
  getTokenMarketData,
  getTokenMetaDataSingle,
  getTokenOverview,
  getTokenTradeDataSingle,
  postMultiPrice,
} from "@/lib/birdeye/cached";
import { chainOf } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

interface PostBody {
  addresses: string[];
}

const WINDOWS: ReadonlyArray<"1h" | "4h" | "8h" | "24h"> = [
  "1h",
  "4h",
  "8h",
  "24h",
];

/**
 * Token compare bundle. Returns one row per address with everything Compare
 * renders. Internally we Promise.allSettled so a single dead endpoint per
 * token doesn't kill the matrix.
 */
export async function POST(req: Request) {
  const chain = chainOf(req);
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const addresses = (body.addresses ?? [])
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (addresses.length === 0)
    return NextResponse.json({ rows: [], priceMap: {} });

  const priceMapP = postMultiPrice(
    { list_address: addresses, include_liquidity: true },
    chain as never,
  ).catch(() => ({}));

  const rowsP = Promise.all(
    addresses.map(async (address) => {
      const [overview, meta, market, trade, allTime, ...windows] =
        await Promise.allSettled([
          getTokenOverview({ address }, chain as never),
          getTokenMetaDataSingle({ address }, chain as never),
          getTokenMarketData({ address }, chain as never),
          getTokenTradeDataSingle({ address }, chain as never),
          getAllTimeTradesSingle({ address }, chain as never),
          ...WINDOWS.map((w) =>
            getPriceVolumeSingle({ address, type: w }, chain as never),
          ),
        ]);
      return {
        address,
        overview: pick(overview),
        meta: pick(meta),
        market: pick(market),
        trade: pick(trade),
        allTime: pick(allTime),
        windows: Object.fromEntries(
          WINDOWS.map((w, i) => [w, pick(windows[i])]),
        ) as Record<string, unknown>,
      };
    }),
  );

  const [priceMap, rows] = await Promise.all([priceMapP, rowsP]);
  return NextResponse.json({ rows, priceMap });
}

function pick<T>(s: PromiseSettledResult<T> | undefined): T | null {
  if (!s) return null;
  return s.status === "fulfilled" ? s.value : null;
}
