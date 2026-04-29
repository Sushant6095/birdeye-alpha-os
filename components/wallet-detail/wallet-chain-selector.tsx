"use client";

import { useRouter } from "next/navigation";
import { useChain } from "@/components/providers/chain-provider";

/**
 * Wallet-page network selector. Differs from the global ChainSelector in
 * the topbar by also navigating the URL to /wallet/{newchain}/{address}
 * so the SSR re-runs against that network.
 */
export function WalletChainSelector({
  chain,
  wallet,
}: {
  chain: string;
  wallet: string;
}) {
  const router = useRouter();
  const { available, setChain } = useChain();
  return (
    <select
      value={chain}
      onChange={(e) => {
        const next = e.target.value;
        setChain(next);
        router.push(`/wallet/${next}/${wallet}`);
      }}
      className="text-xs bg-secondary/40 border border-border rounded px-2 h-7 capitalize"
    >
      {(available.includes(chain) ? available : [chain, ...available]).map(
        (c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ),
      )}
    </select>
  );
}
