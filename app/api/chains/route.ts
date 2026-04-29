import { NextResponse } from "next/server";
import { getNetworks } from "@/lib/birdeye/cached";

const FALLBACK = [
  "solana",
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "avalanche",
  "bsc",
  "zksync",
  "sui",
];

export const dynamic = "force-dynamic";
export const revalidate = 86400;

export async function GET() {
  try {
    const data = await getNetworks();
    let chains: string[] = [];
    if (Array.isArray(data)) {
      chains = data
        .map((d) =>
          typeof d === "string" ? d : ((d as { chain?: string })?.chain ?? null),
        )
        .filter((x): x is string => !!x);
    } else if (data && typeof data === "object") {
      const items = (data as { items?: unknown[] }).items ?? [];
      chains = (items as Array<unknown>)
        .map((d) =>
          typeof d === "string" ? d : ((d as { chain?: string })?.chain ?? null),
        )
        .filter((x): x is string => !!x);
    }
    if (chains.length === 0) chains = FALLBACK;
    return NextResponse.json({ chains });
  } catch (err) {
    // never break the chain selector — fall back to a hardcoded list
    if (process.env.NODE_ENV !== "production") {
      console.warn("[chains] getNetworks failed, returning fallback", err);
    }
    return NextResponse.json({ chains: FALLBACK });
  }
}
