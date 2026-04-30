"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CHAIN_META: Record<
  string,
  { label: string; symbol: string; color: string; slug: string }
> = {
  solana:    { label: "Solana",    symbol: "SOL",   color: "from-violet-400 to-fuchsia-500", slug: "solana" },
  ethereum:  { label: "Ethereum",  symbol: "ETH",   color: "from-sky-400 to-indigo-500",     slug: "ethereum" },
  base:      { label: "Base",      symbol: "BASE",  color: "from-blue-400 to-blue-600",      slug: "base" },
  arbitrum:  { label: "Arbitrum",  symbol: "ARB",   color: "from-cyan-400 to-blue-500",      slug: "arbitrum" },
  optimism:  { label: "Optimism",  symbol: "OP",    color: "from-rose-400 to-red-500",       slug: "optimism" },
  polygon:   { label: "Polygon",   symbol: "MATIC", color: "from-purple-400 to-violet-600",  slug: "polygon" },
  avalanche: { label: "Avalanche", symbol: "AVAX",  color: "from-rose-400 to-red-600",       slug: "avalanche" },
  bsc:       { label: "BSC",       symbol: "BNB",   color: "from-yellow-400 to-amber-500",   slug: "bsc" },
  zksync:    { label: "zkSync",    symbol: "ZK",    color: "from-zinc-300 to-zinc-500",      slug: "zksync-era" },
  sui:       { label: "Sui",       symbol: "SUI",   color: "from-cyan-300 to-sky-500",       slug: "sui" },
};

export function getChainMeta(chain: string) {
  return (
    CHAIN_META[chain.toLowerCase()] ?? {
      label: chain,
      symbol: chain.slice(0, 3).toUpperCase(),
      color: "from-sky-300 to-sky-500",
      slug: chain.toLowerCase(),
    }
  );
}

function logoUrl(slug: string) {
  // DefiLlama maintains a chain-icon registry that covers every chain we use.
  return `https://icons.llamao.fi/icons/chains/rsz_${slug}?w=64&h=64`;
}

export function ChainBadge({
  chain,
  size = "md",
  className,
}: {
  chain: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = getChainMeta(chain);
  const [errored, setErrored] = useState(false);

  const dim =
    size === "sm" ? "h-6 w-6 text-[10px]" :
    size === "lg" ? "h-12 w-12 text-base" :
    "h-9 w-9 text-xs";

  const base =
    "inline-flex items-center justify-center rounded-full font-bold tracking-tight ring-1 ring-white/10 overflow-hidden";

  if (errored) {
    return (
      <span
        className={cn(base, "bg-gradient-to-br text-black/80", meta.color, dim, className)}
        title={meta.label}
      >
        {meta.symbol.slice(0, 3)}
      </span>
    );
  }

  // Render the per-chain gradient under the <img>. While the icon CDN is
  // loading the badge is still visibly colored — important on the orb.
  return (
    <span
      className={cn(base, "bg-gradient-to-br relative", meta.color, dim, className)}
      title={meta.label}
    >
      <img
        src={logoUrl(meta.slug)}
        alt={meta.label}
        loading="eager"
        decoding="async"
        onError={() => setErrored(true)}
        className="absolute inset-0 h-full w-full rounded-full object-cover"
      />
    </span>
  );
}
