import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LivePriceTick } from "./live-price-tick";
import { SecurityBadges } from "./security-badges";
import { MetadataRow } from "./metadata-row";
import type { InitialBundle } from "./types";
import { AddToWatchlistButton } from "@/components/watchlist/add-button";

export function TokenHeader({ bundle }: { bundle: InitialBundle }) {
  const { overview, security, meta, isTrending, chain, address } = bundle;
  const sym = overview?.symbol ?? meta?.symbol ?? "—";
  const name = overview?.name ?? meta?.name;
  const logo =
    overview?.logoURI ??
    (meta?.logo_uri as string | undefined) ??
    undefined;

  return (
    <header className="border-b border-border bg-background/60 backdrop-blur sticky top-14 z-20">
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className="h-12 w-12 rounded-full bg-secondary border border-border object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">
                {sym.slice(0, 3)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight truncate">
                {sym}
              </h1>
              {name && name !== sym && (
                <span className="text-sm text-muted-foreground truncate">
                  {name}
                </span>
              )}
              <Badge variant="outline" className="capitalize">
                {chain}
              </Badge>
              {isTrending && (
                <Badge variant="warn" className="gap-1">
                  <Flame className="h-3 w-3" />
                  trending
                </Badge>
              )}
              <AddToWatchlistButton
                item={{
                  chain,
                  address,
                  symbol: sym,
                  kind: "token",
                }}
                className="ml-1"
              />
            </div>
            <div className="mt-2">
              <LivePriceTick
                chain={chain}
                address={address}
                initialPrice={overview?.price}
                initialChange={overview?.priceChange24hPercent}
                initialMc={overview?.mc ?? overview?.marketCap}
                initialHolders={overview?.holder}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <SecurityBadges security={security} />
          <MetadataRow meta={meta} overview={overview} address={address} />
        </div>
      </div>
    </header>
  );
}
