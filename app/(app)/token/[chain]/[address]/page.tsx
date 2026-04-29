import { notFound } from "next/navigation";
import { TokenHeader } from "@/components/token-detail/header";
import { TokenChart } from "@/components/token-detail/chart";
import { StatsPanel } from "@/components/token-detail/stats-panel";
import { HoldersPanel } from "@/components/token-detail/holders-panel";
import { TradesPanel } from "@/components/token-detail/trades-panel";
import { TopTradersPanel } from "@/components/token-detail/top-traders-panel";
import { DeployerStrip } from "@/components/token-detail/deployer-strip";
import { LiquidityGauge } from "@/components/token-detail/liquidity-gauge";
import { TransfersPanel } from "@/components/token-detail/transfers-panel";
import { MemePanel } from "@/components/token-detail/meme-panel";
import { loadTokenBundle, looksLikeMeme } from "@/components/token-detail/load-bundle";
import { num } from "@/lib/format";

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

  const bundle = await loadTokenBundle(chain, address);
  const isMeme = looksLikeMeme(bundle);

  return (
    <div className="pb-12">
      <TokenHeader bundle={bundle} />

      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4 min-w-0">
          <DeployerStrip creation={bundle.creation} chain={chain} />
          <TokenChart chain={chain} address={address} />
          <TradesPanel chain={chain} address={address} />
          <TopTradersPanel chain={chain} address={address} />
          <TransfersPanel chain={chain} address={address} />
          {isMeme && <MemePanel chain={chain} address={address} />}
        </div>
        <aside className="space-y-4 min-w-0">
          <LiquidityGauge
            liquidity={
              num(bundle.marketData?.liquidity) ??
              num(bundle.overview?.liquidity)
            }
          />
          <StatsPanel
            chain={chain}
            address={address}
            marketData={bundle.marketData}
            tradeData={bundle.tradeData}
            allTime={bundle.allTime}
          />
          <HoldersPanel chain={chain} address={address} />
        </aside>
      </div>
    </div>
  );
}
