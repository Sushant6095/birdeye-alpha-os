import { notFound } from "next/navigation";
import { Suspense } from "react";
import { checkAddress } from "@/lib/api/address";
import { ErrorState } from "@/components/ui/error-state";
import { TokenChart } from "@/components/token-detail/chart-lazy";
import { HoldersPanel } from "@/components/token-detail/holders-panel";
import { TradesPanel } from "@/components/token-detail/trades-panel";
import { TopTradersPanel } from "@/components/token-detail/top-traders-panel";
import { TransfersPanel } from "@/components/token-detail/transfers-panel";
import {
  HeaderSlot,
  DeployerSlot,
  LiquiditySlot,
  StatsSlot,
  MemeSlot,
} from "@/components/token-detail/slots";
import {
  HeaderSkeleton,
  DeployerSkeleton,
  LiquiditySkeleton,
  StatsSkeleton,
  MemeSkeleton,
} from "@/components/token-detail/skeletons";
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

export const dynamic = "force-dynamic";

const SUPPORTED = new Set([
  "solana",
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "bsc",
  "avalanche",
  "sui",
  "zksync",
  "berachain",
  "ronin",
  "linea",
  "sei",
  "monad",
  "abstract",
  "hyperliquid",
]);

interface Params {
  chain: string;
  address: string;
}

export default async function TokenPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { chain, address } = await params;
  if (!SUPPORTED.has(chain)) notFound();
  if (!address || address.length < 6) notFound();

  // Block doomed URLs (chain ↔ address shape mismatch) before any Birdeye call.
  const check = checkAddress(chain, address);
  if (!check.ok) {
    const suggested = check.suggestedChain;
    return (
      <ErrorState
        title="Address doesn't match this chain"
        message={check.reason ?? "URL chain and address format don't agree."}
        hint={
          suggested
            ? `Try /token/${suggested}/${address}`
            : "Pick the right chain in the selector and search again."
        }
        detail={`URL chain: ${chain}\nAddress:   ${address}\nExpected:  ${check.expected}`}
        primaryHref={suggested ? `/token/${suggested}/${address}` : "/discover"}
        primaryLabel={suggested ? `Open on ${suggested}` : "Back to Discover"}
      />
    );
  }

  /* --------------------------------------------------------------------- *
   * Kick off every Birdeye call in parallel — but DO NOT await any of them
   * here. Each Promise is threaded into the slot that needs it. Slots are
   * wrapped in <Suspense> below, so HTML streams panel-by-panel as the
   * upstream calls resolve.
   *
   * Same Promise reference reused across slots = one fetch even when two
   * panels read the same field (e.g. marketData feeds both Liquidity and
   * Stats).
   * --------------------------------------------------------------------- */
  const overviewP    = getTokenOverview({ address }, chain as never);
  const securityP    = getTokenSecurity({ address }, chain as never);
  const marketDataP  = getTokenMarketData({ address }, chain as never);
  const tradeDataP   = getTokenTradeDataSingle({ address }, chain as never);
  const allTimeP     = getAllTimeTradesSingle({ address }, chain as never);
  const creationP    = getTokenCreationInfo({ address }, chain as never);
  const metaP        = getTokenMetaDataSingle({ address }, chain as never);
  const trendingP    = getTokenTrending({ limit: 20 }, chain as never);

  // Prevent unhandled-rejection warnings if a Promise rejects before being
  // awaited inside a Suspense boundary. Slots themselves swallow errors via
  // the per-await `safe()` wrapper.
  const NOOP_REJECT = () => undefined;
  overviewP.catch(NOOP_REJECT);
  securityP.catch(NOOP_REJECT);
  marketDataP.catch(NOOP_REJECT);
  tradeDataP.catch(NOOP_REJECT);
  allTimeP.catch(NOOP_REJECT);
  creationP.catch(NOOP_REJECT);
  metaP.catch(NOOP_REJECT);
  trendingP.catch(NOOP_REJECT);

  return (
    <div className="pb-12">
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderSlot
          chain={chain}
          address={address}
          overviewP={overviewP}
          securityP={securityP}
          metaP={metaP}
          marketDataP={marketDataP}
          tradeDataP={tradeDataP}
          allTimeP={allTimeP}
          creationP={creationP}
          trendingP={trendingP}
        />
      </Suspense>

      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4 min-w-0">
          <Suspense fallback={<DeployerSkeleton />}>
            <DeployerSlot chain={chain} address={address} creationP={creationP} />
          </Suspense>
          {/* Chart is already a lazy client component — loads in its own time */}
          <TokenChart chain={chain} address={address} />
          {/* These three are client components fetching via React Query — they
              start as soon as the slot above streams. */}
          <TradesPanel chain={chain} address={address} />
          <TopTradersPanel chain={chain} address={address} />
          <TransfersPanel chain={chain} address={address} />
          <Suspense fallback={<MemeSkeleton />}>
            <MemeSlot
              chain={chain}
              address={address}
              overviewP={overviewP}
              metaP={metaP}
            />
          </Suspense>
        </div>
        <aside className="space-y-4 min-w-0">
          <Suspense fallback={<LiquiditySkeleton />}>
            <LiquiditySlot overviewP={overviewP} marketDataP={marketDataP} />
          </Suspense>
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSlot
              chain={chain}
              address={address}
              marketDataP={marketDataP}
              tradeDataP={tradeDataP}
              allTimeP={allTimeP}
            />
          </Suspense>
          <HoldersPanel chain={chain} address={address} />
        </aside>
      </div>
    </div>
  );
}
