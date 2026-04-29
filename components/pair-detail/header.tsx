import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fmtUsd, fmtCount, num, shortAddr } from "@/lib/format";
import type { PairBundle } from "./load-bundle";

export function PairHeader({ bundle }: { bundle: PairBundle }) {
  const o = bundle.overview;
  const base = o?.base;
  const quote = o?.quote;
  return (
    <header className="border-b border-border bg-background/60 backdrop-blur sticky top-14 z-20">
      <div className="px-4 sm:px-6 py-4 flex items-start gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <TokenChip token={base} chain={bundle.chain} />
          <span className="text-muted-foreground">/</span>
          <TokenChip token={quote} chain={bundle.chain} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight">
              {base?.symbol ?? "—"} / {quote?.symbol ?? "—"}
            </h1>
            <Badge variant="outline" className="capitalize">
              {bundle.chain}
            </Badge>
            {o?.source && (
              <Badge variant="secondary" className="uppercase">
                {String(o.source)}
              </Badge>
            )}
          </div>
          <code
            className="font-mono text-xs text-muted-foreground"
            title={bundle.address}
          >
            pair {shortAddr(bundle.address, 6, 6)}
          </code>
          <div className="flex items-center gap-4 text-xs flex-wrap mt-1">
            <Stat label="Price" value={fmtUsd(num(o?.price), { precise: true })} />
            <Stat label="Liquidity" value={fmtUsd(num(o?.liquidity))} />
            <Stat label="24h volume" value={fmtUsd(num(o?.volume24h))} />
            <Stat label="24h txs" value={fmtCount(num(o?.txCount24h))} />
          </div>
        </div>
      </div>
    </header>
  );
}

function TokenChip({
  token,
  chain,
}: {
  token: { address?: string; symbol?: string; logoURI?: string } | undefined;
  chain: string;
}) {
  const sym = token?.symbol ?? "—";
  if (!token?.address) {
    return (
      <span className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">
        {sym.slice(0, 2)}
      </span>
    );
  }
  return (
    <Link
      href={`/token/${chain}/${token.address}`}
      className="inline-flex items-center gap-1.5 group"
      title={token.address}
    >
      {token.logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={token.logoURI}
          alt=""
          className="h-9 w-9 rounded-full bg-secondary border border-border object-cover"
        />
      ) : (
        <span className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">
          {sym.slice(0, 2)}
        </span>
      )}
      <span className="font-medium group-hover:text-foreground">{sym}</span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-muted-foreground">
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </span>
  );
}
