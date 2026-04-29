import { NextResponse } from "next/server";
import {
  getWalletNetworth,
  getWalletPnLSummary,
} from "@/lib/birdeye/cached";
import { chainOf } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

interface PostBody {
  wallets: string[];
}

export async function POST(req: Request) {
  const chain = chainOf(req);
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const wallets = (body.wallets ?? [])
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (wallets.length === 0) return NextResponse.json({ rows: [] });

  const rows = await Promise.all(
    wallets.map(async (wallet) => {
      const [nw, pnl] = await Promise.allSettled([
        getWalletNetworth({ wallet }, chain as never),
        getWalletPnLSummary({ address: wallet, type: "all" }, chain as never),
      ]);
      return {
        wallet,
        networth: nw.status === "fulfilled" ? nw.value : null,
        pnl: pnl.status === "fulfilled" ? pnl.value : null,
      };
    }),
  );
  return NextResponse.json({ rows });
}
