import { notFound } from "next/navigation";
import { WalletHeader } from "@/components/wallet-detail/header";
import { WalletTabs } from "@/components/wallet-detail/tabs";
import { SideBalanceWidget } from "@/components/wallet-detail/side-balance-widget";
import { loadWalletBundle } from "@/components/wallet-detail/load-bundle";

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

export default async function WalletPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { chain, address } = await params;
  if (!SUPPORTED.has(chain)) notFound();
  if (!address || address.length < 6) notFound();

  const bundle = await loadWalletBundle(chain, address);

  return (
    <div className="pb-12">
      <WalletHeader bundle={bundle} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-0">
        <div>
          <WalletTabs bundle={bundle} />
        </div>
        <div className="px-4 sm:px-6 py-4">
          <SideBalanceWidget chain={chain} wallet={address} />
        </div>
      </div>
    </div>
  );
}
