import { NextResponse } from "next/server";
import { getTopTraders } from "@/lib/birdeye/cached";
import { chainOf } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

interface PostBody {
  addresses: string[];
}

export async function POST(req: Request) {
  const chain = chainOf(req);
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const addresses = (body.addresses ?? [])
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (addresses.length < 2) return NextResponse.json({ overlap: [] });

  const sets = await Promise.all(
    addresses.map(async (addr) => {
      try {
        const data = await getTopTraders(
          { address: addr, limit: 50, time_frame: "24h", sort_by: "PnL", sort_type: "desc" },
          chain as never,
        );
        const items =
          ((data as { items?: unknown[] })?.items as Record<
            string,
            unknown
          >[]) ?? [];
        const owners = new Set<string>();
        for (const it of items) {
          const w =
            (it["owner"] as string | undefined) ??
            (it["address"] as string | undefined);
          if (w) owners.add(w.toLowerCase());
        }
        return { addr, owners };
      } catch {
        return { addr, owners: new Set<string>() };
      }
    }),
  );

  const counts = new Map<string, { wallet: string; count: number; tokens: string[] }>();
  for (const { addr, owners } of sets) {
    for (const w of owners) {
      const entry = counts.get(w) ?? { wallet: w, count: 0, tokens: [] };
      entry.count++;
      entry.tokens.push(addr);
      counts.set(w, entry);
    }
  }
  const overlap = [...counts.values()]
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
  return NextResponse.json({ overlap });
}
