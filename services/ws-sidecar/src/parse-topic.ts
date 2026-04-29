import type { TopicKind, TopicParams } from "./topics.js";

/** Parse a topic kind + query parameters into a TopicParams discriminated union. */
export function parseTopic(
  kind: string,
  q: Record<string, string | undefined>,
): { ok: true; topic: TopicParams } | { ok: false; error: string } {
  const k = kind as TopicKind;
  switch (k) {
    case "price": {
      if (!q.address) return missing("address");
      return ok({
        kind: "price",
        params: {
          address: q.address,
          chartType: q.interval ?? q.chartType,
          currency: (q.currency as "usd" | "pair" | "native" | undefined) ?? "usd",
        },
      });
    }
    case "txs": {
      if (!q.address) return missing("address");
      return ok({
        kind: "txs",
        params: {
          address: q.address,
          queryType: (q.queryType as "simple" | "complex" | undefined) ?? "simple",
        },
      });
    }
    case "base_quote_price": {
      if (!q.base) return missing("base");
      if (!q.quote) return missing("quote");
      return ok({
        kind: "base_quote_price",
        params: {
          baseAddress: q.base,
          quoteAddress: q.quote,
          chartType: q.interval ?? q.chartType,
        },
      });
    }
    case "new_listing": {
      return ok({
        kind: "new_listing",
        params: {
          memePlatformEnabled:
            q.memePlatformEnabled === "1" || q.memePlatformEnabled === "true",
          minLiquidity: numOpt(q.minLiquidity),
        },
      });
    }
    case "new_pair": {
      return ok({
        kind: "new_pair",
        params: { minLiquidity: numOpt(q.minLiquidity) },
      });
    }
    case "large_trade": {
      return ok({
        kind: "large_trade",
        params: { minVolume: numOpt(q.minUsd ?? q.minVolume) },
      });
    }
    case "wallet_txs": {
      if (!q.address) return missing("address");
      return ok({ kind: "wallet_txs", params: { address: q.address } });
    }
    case "token_stats": {
      if (!q.address) return missing("address");
      return ok({ kind: "token_stats", params: { address: q.address } });
    }
    case "meme_stats": {
      return ok({ kind: "meme_stats", params: {} });
    }
    default:
      return { ok: false, error: `unknown topic kind: ${kind}` };
  }
}

function ok(topic: TopicParams) {
  return { ok: true as const, topic };
}
function missing(name: string) {
  return { ok: false as const, error: `missing required param: ${name}` };
}
function numOpt(v: string | undefined): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
