import { NextResponse } from "next/server";
import { getTokenHolder } from "@/lib/birdeye/cached";
import { chainOf, intParam } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

interface PostBody {
  addresses: string[];
}

interface OverlapWallet {
  wallet: string;
  /** how many of the compared tokens this wallet holds */
  count: number;
  tokens: string[];
}

/**
 * Top-N holder overlap detection across compared tokens.
 *
 * For each token we pull the top `topN` holders, then intersect by `owner`.
 * Returns wallets that appear in at least 2 of the supplied tokens, sorted
 * by overlap count desc.
 */
export async function POST(req: Request) {
  const chain = chainOf(req);
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const addresses = (body.addresses ?? [])
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (addresses.length < 2)
    return NextResponse.json({ overlap: [] });

  const topN = intParam(req, "topN", 100)!;

  const sets = await Promise.all(
    addresses.map(async (addr) => {
      try {
        const data = await getTokenHolder(
          { address: addr, limit: topN, offset: 0 },
          chain as never,
        );
        const items =
          ((data as { items?: unknown[] })?.items as Record<
            string,
            unknown
          >[]) ?? [];
        const owners = new Set<string>();
        for (const it of items) {
          const owner =
            (it["owner"] as string | undefined) ??
            (it["address"] as string | undefined);
          if (owner) owners.add(owner.toLowerCase());
        }
        return { addr, owners };
      } catch {
        return { addr, owners: new Set<string>() };
      }
    }),
  );

  const counts = new Map<string, OverlapWallet>();
  for (const { addr, owners } of sets) {
    for (const owner of owners) {
      let entry = counts.get(owner);
      if (!entry) {
        entry = { wallet: owner, count: 0, tokens: [] };
        counts.set(owner, entry);
      }
      entry.count++;
      entry.tokens.push(addr);
    }
  }

  const overlap = [...counts.values()]
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  return NextResponse.json({ overlap, totalChecked: sets.map((s) => s.owners.size) });
}
