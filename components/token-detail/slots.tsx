import "server-only";
import type {
  AllTimeTrades,
  CreationInfo,
  InitialBundle,
  TokenMarketData,
  TokenMeta,
  TokenOverview,
  TokenSecurity,
  TokenTradeData,
} from "./types";
import { TokenHeader } from "./header";
import { DeployerStrip } from "./deployer-strip";
import { LiquidityGauge } from "./liquidity-gauge";
import { StatsPanel } from "./stats-panel";
import { MemePanel } from "./meme-panel";
import { num } from "@/lib/format";
import { looksLikeMeme } from "./load-bundle";

/* -------------------------------------------------------------------------
 * Each slot is a small async server component that awaits ONLY the promises
 * it needs. Sibling slots are wrapped in <Suspense> by the page, so HTML
 * streams panel-by-panel as upstream calls resolve.
 *
 * Promises are created once at the page level and threaded through, so
 * downstream slots reuse the same in-flight fetch (no double-call).
 *
 * Every await is `Promise.resolve(p).catch(() => null)` so a single failed
 * Birdeye call only zeros out one panel — the rest still render.
 * -------------------------------------------------------------------------*/

function safe<T>(p: Promise<unknown>): Promise<T | null> {
  return p.then((v) => v as T).catch(() => null);
}

interface CommonProps {
  chain: string;
  address: string;
}

/* All upstream promises are typed `unknown` here so callers can pass the raw
 * zod-inferred shapes from `lib/birdeye/cached`. Each slot casts via `safe<T>`
 * to the loose hand-written interfaces in `./types`. */
type AnyP = Promise<unknown>;

interface HeaderSlotProps extends CommonProps {
  overviewP: AnyP;
  securityP: AnyP;
  metaP: AnyP;
  marketDataP: AnyP;
  tradeDataP: AnyP;
  allTimeP: AnyP;
  creationP: AnyP;
  trendingP: AnyP;
}

export async function HeaderSlot({
  chain,
  address,
  overviewP,
  securityP,
  metaP,
  marketDataP,
  tradeDataP,
  allTimeP,
  creationP,
  trendingP,
}: HeaderSlotProps) {
  const [overview, security, meta, marketData, tradeData, allTime, creation, trending] =
    await Promise.all([
      safe<TokenOverview>(overviewP),
      safe<TokenSecurity>(securityP),
      safe<TokenMeta>(metaP),
      safe<TokenMarketData>(marketDataP),
      safe<TokenTradeData>(tradeDataP),
      safe<AllTimeTrades>(allTimeP),
      safe<CreationInfo>(creationP),
      safe<unknown>(trendingP),
    ]);
  const isTrending = isTrendingMatch(trending, address);

  const bundle: InitialBundle = {
    chain,
    address,
    overview,
    security,
    meta,
    marketData,
    tradeData,
    allTime,
    creation,
    isTrending,
  };
  return <TokenHeader bundle={bundle} />;
}

interface DeployerSlotProps extends CommonProps {
  creationP: AnyP;
}
export async function DeployerSlot({ chain, creationP }: DeployerSlotProps) {
  const creation = await safe<CreationInfo>(creationP);
  return <DeployerStrip creation={creation} chain={chain} />;
}

interface LiquiditySlotProps {
  overviewP: AnyP;
  marketDataP: AnyP;
}
export async function LiquiditySlot({
  overviewP,
  marketDataP,
}: LiquiditySlotProps) {
  const [overview, marketData] = await Promise.all([
    safe<TokenOverview>(overviewP),
    safe<TokenMarketData>(marketDataP),
  ]);
  return (
    <LiquidityGauge
      liquidity={num(marketData?.liquidity) ?? num(overview?.liquidity)}
    />
  );
}

interface StatsSlotProps extends CommonProps {
  marketDataP: AnyP;
  tradeDataP: AnyP;
  allTimeP: AnyP;
}
export async function StatsSlot({
  chain,
  address,
  marketDataP,
  tradeDataP,
  allTimeP,
}: StatsSlotProps) {
  const [marketData, tradeData, allTime] = await Promise.all([
    safe<TokenMarketData>(marketDataP),
    safe<TokenTradeData>(tradeDataP),
    safe<AllTimeTrades>(allTimeP),
  ]);
  return (
    <StatsPanel
      chain={chain}
      address={address}
      marketData={marketData}
      tradeData={tradeData}
      allTime={allTime}
    />
  );
}

interface MemeSlotProps extends CommonProps {
  overviewP: AnyP;
  metaP: AnyP;
}
/**
 * Renders the meme panel only if overview/meta tags suggest a meme token.
 * Awaiting both gives us the deterministic gate before deciding to render.
 */
export async function MemeSlot({
  chain,
  address,
  overviewP,
  metaP,
}: MemeSlotProps) {
  const [overview, meta] = await Promise.all([
    safe<TokenOverview>(overviewP),
    safe<TokenMeta>(metaP),
  ]);
  const partial: InitialBundle = {
    chain,
    address,
    overview,
    meta,
    security: null,
    marketData: null,
    tradeData: null,
    allTime: null,
    creation: null,
    isTrending: false,
  };
  if (!looksLikeMeme(partial)) return null;
  return <MemePanel chain={chain} address={address} />;
}

/* helpers */

function isTrendingMatch(trending: unknown, address: string): boolean {
  if (!trending || typeof trending !== "object") return false;
  const r = trending as Record<string, unknown>;
  const arr = Array.isArray(r["tokens"])
    ? r["tokens"]
    : Array.isArray(r["items"])
      ? r["items"]
      : [];
  return arr.some((t) => {
    const a = (t as { address?: string })?.address;
    return typeof a === "string" && a.toLowerCase() === address.toLowerCase();
  });
}
