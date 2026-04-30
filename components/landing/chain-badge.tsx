import { cn } from "@/lib/utils";

const CHAIN_META: Record<
  string,
  { label: string; symbol: string; color: string }
> = {
  solana:    { label: "Solana",    symbol: "SOL",  color: "from-violet-400 to-fuchsia-500" },
  ethereum:  { label: "Ethereum",  symbol: "ETH",  color: "from-sky-400 to-indigo-500" },
  base:      { label: "Base",      symbol: "BASE", color: "from-blue-400 to-blue-600" },
  arbitrum:  { label: "Arbitrum",  symbol: "ARB",  color: "from-cyan-400 to-blue-500" },
  optimism:  { label: "Optimism",  symbol: "OP",   color: "from-rose-400 to-red-500" },
  polygon:   { label: "Polygon",   symbol: "MATIC",color: "from-purple-400 to-violet-600" },
  avalanche: { label: "Avalanche", symbol: "AVAX", color: "from-rose-400 to-red-600" },
  bsc:       { label: "BSC",       symbol: "BNB",  color: "from-yellow-400 to-amber-500" },
  zksync:    { label: "zkSync",    symbol: "ZK",   color: "from-zinc-300 to-zinc-500" },
  sui:       { label: "Sui",       symbol: "SUI",  color: "from-cyan-300 to-sky-500" },
};

export function getChainMeta(chain: string) {
  return (
    CHAIN_META[chain.toLowerCase()] ?? {
      label: chain,
      symbol: chain.slice(0, 3).toUpperCase(),
      color: "from-emerald-300 to-emerald-500",
    }
  );
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
  const dim =
    size === "sm" ? "h-6 w-6 text-[10px]" :
    size === "lg" ? "h-12 w-12 text-base" :
    "h-9 w-9 text-xs";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tracking-tight text-black/80 ring-1 ring-white/20",
        "bg-gradient-to-br",
        meta.color,
        dim,
        className,
      )}
      title={meta.label}
    >
      {meta.symbol.slice(0, 3)}
    </span>
  );
}
