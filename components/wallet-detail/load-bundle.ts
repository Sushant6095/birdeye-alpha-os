import "server-only";
import {
  getWalletNetworth,
  getWalletPnLSummary,
  getWalletTokenList,
} from "@/lib/birdeye/cached";
import {
  classifyWallet,
  type WalletVerdict,
  type WalletVerdictInputs,
} from "@/lib/verdict/wallet";

export interface PnLSummary {
  pnl?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  win_rate?: number;
  trade_count?: number;
  volume?: number;
  [k: string]: unknown;
}

export interface PortfolioItem {
  address?: string;
  symbol?: string;
  uiAmount?: number;
  valueUsd?: number;
  priceUsd?: number;
  [k: string]: unknown;
}

export interface WalletBundle {
  chain: string;
  wallet: string;
  netWorthUsd: number | null;
  pnl: PnLSummary | null;
  portfolio: PortfolioItem[];
  verdict: WalletVerdict;
}

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 3 REST calls in parallel for the SSR header. Other tabs lazy-load.
 *
 * Returns a WalletBundle that always renders — failures degrade to nulls
 * and the verdict falls back to "Inactive" so the page never blank-screens.
 */
export async function loadWalletBundle(
  chain: string,
  wallet: string,
): Promise<WalletBundle> {
  const [networthR, pnlR, portfolioR] = await Promise.allSettled([
    getWalletNetworth({ wallet }, chain as never),
    getWalletPnLSummary({ address: wallet, type: "all" }, chain as never),
    getWalletTokenList({ wallet }, chain as never),
  ]);

  const netWorthUsd =
    networthR.status === "fulfilled"
      ? num(
          (networthR.value as { totalUsd?: number })?.totalUsd ??
            (networthR.value as { netWorth?: number })?.netWorth,
        ) ?? null
      : null;

  const pnl: PnLSummary | null =
    pnlR.status === "fulfilled" ? (pnlR.value as PnLSummary) : null;

  const portfolio: PortfolioItem[] =
    portfolioR.status === "fulfilled"
      ? (((portfolioR.value as { items?: PortfolioItem[] })?.items ??
          []) as PortfolioItem[])
      : [];

  const verdictInputs = deriveVerdictInputs(pnl, portfolio);
  const verdict = classifyWallet(verdictInputs);

  return {
    chain,
    wallet,
    netWorthUsd,
    pnl,
    portfolio,
    verdict,
  };
}

/**
 * Map Birdeye PnL summary + portfolio into the verdict's input shape.
 * Fields that aren't directly returned (avgHoldingHours, daysSince*) are
 * defaulted conservatively so the heuristics don't over-classify on
 * incomplete data.
 */
function deriveVerdictInputs(
  pnl: PnLSummary | null,
  portfolio: PortfolioItem[],
): Partial<WalletVerdictInputs> {
  return {
    realizedPnlUsd: num(pnl?.realized_pnl) ?? num(pnl?.pnl) ?? 0,
    unrealizedPnlUsd: num(pnl?.unrealized_pnl) ?? 0,
    totalVolumeUsd: num(pnl?.volume) ?? 0,
    tradeCount: num(pnl?.trade_count) ?? 0,
    winRatePct: num(pnl?.win_rate) ?? 0,
    // Birdeye doesn't expose these directly on the summary; conservative
    // defaults — UI later refines on /pnl tab once detail loads.
    avgHoldingHours: 24,
    uniqueTokens: portfolio.length,
    daysSinceFirstTx: 90,
    daysSinceLastTx: 1,
  };
}
