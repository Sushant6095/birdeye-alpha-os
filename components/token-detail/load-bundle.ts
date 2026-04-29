import "server-only";
import {
  getAllTimeTradesSingle,
  getTokenCreationInfo,
  getTokenMarketData,
  getTokenMetaDataSingle,
  getTokenOverview,
  getTokenSecurity,
  getTokenTradeDataSingle,
  getTokenTrending,
} from "@/lib/birdeye/cached";
import type { InitialBundle } from "./types";

/**
 * Server-side initial fetch for the Token Lens page. Exactly 8 REST calls
 * fire in parallel; failures degrade to `null` so the page still renders.
 */
export async function loadTokenBundle(
  chain: string,
  address: string,
): Promise<InitialBundle> {
  const calls = [
    getTokenOverview({ address }, chain as never),
    getTokenSecurity({ address }, chain as never),
    getTokenMarketData({ address }, chain as never),
    getTokenTradeDataSingle({ address }, chain as never),
    getAllTimeTradesSingle({ address }, chain as never),
    getTokenCreationInfo({ address }, chain as never),
    getTokenMetaDataSingle({ address }, chain as never),
    getTokenTrending({ limit: 20 }, chain as never),
  ] as const;

  const settled = await Promise.allSettled(calls);
  const ok = <T,>(idx: number): T | null =>
    settled[idx]?.status === "fulfilled"
      ? (settled[idx] as PromiseFulfilledResult<T>).value
      : null;

  const trendingResp = ok<unknown>(7);
  const trendingItems = trendingItemsFrom(trendingResp);
  const isTrending = trendingItems.some((t) => {
    const a = (t as { address?: string })?.address;
    return typeof a === "string" && a.toLowerCase() === address.toLowerCase();
  });

  return {
    chain,
    address,
    overview: ok(0),
    security: ok(1),
    marketData: ok(2),
    tradeData: ok(3),
    allTime: ok(4),
    creation: ok(5),
    meta: ok(6),
    isTrending,
  };
}

function trendingItemsFrom(resp: unknown): unknown[] {
  if (!resp || typeof resp !== "object") return [];
  const r = resp as Record<string, unknown>;
  if (Array.isArray(r["tokens"])) return r["tokens"];
  if (Array.isArray(r["items"])) return r["items"];
  return [];
}

/** Loose "is this a meme token?" check based on overview/meta tags. */
export function looksLikeMeme(bundle: InitialBundle): boolean {
  const ext =
    (bundle.meta?.extensions as Record<string, unknown> | undefined) ??
    (bundle.overview?.extensions as Record<string, unknown> | undefined) ??
    {};
  const tags = ext["tags"] ?? ext["categories"] ?? ext["category"];
  if (Array.isArray(tags)) {
    return tags.some((t) => String(t).toLowerCase().includes("meme"));
  }
  if (typeof tags === "string") return tags.toLowerCase().includes("meme");
  return false;
}
