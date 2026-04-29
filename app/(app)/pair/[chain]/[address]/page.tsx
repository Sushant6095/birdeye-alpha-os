import { notFound } from "next/navigation";
import { PairHeader } from "@/components/pair-detail/header";
import { PairChart } from "@/components/pair-detail/chart-lazy";
import { PairTradesPanel } from "@/components/pair-detail/trades-panel";
import { loadPairBundle } from "@/components/pair-detail/load-bundle";

export const dynamic = "force-dynamic";

interface Params {
  chain: string;
  address: string;
}

export default async function PairPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { chain, address } = await params;
  if (!chain || !address || address.length < 6) notFound();
  const bundle = await loadPairBundle(chain, address);
  return (
    <div className="pb-12">
      <PairHeader bundle={bundle} />
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4 min-w-0">
          <PairChart bundle={bundle} />
          <PairTradesPanel chain={chain} pairAddress={address} />
        </div>
        <aside className="space-y-4">
          <div className="rounded-md border bg-secondary/20 p-4 text-xs text-muted-foreground">
            <p className="uppercase tracking-wider mb-2">Pair info</p>
            <p>
              Toggle the chart between USD-denominated and base/quote
              ratio. Live ticks come from{" "}
              <code className="text-foreground">
                {bundle.overview?.base?.symbol ?? "BASE"}
              </code>
              /
              <code className="text-foreground">
                {bundle.overview?.quote?.symbol ?? "QUOTE"}
              </code>{" "}
              via the WS sidecar.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
