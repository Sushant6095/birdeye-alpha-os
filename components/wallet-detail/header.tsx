import { Wallet as WalletIcon } from "lucide-react";
import { CopyAddress } from "./copy-address";
import { VerdictBadge } from "./verdict-badge";
import { NetWorthSparkline } from "./networth-sparkline";
import { WalletChainSelector } from "./wallet-chain-selector";
import { fmtPct, fmtUsd, num, shortAddr } from "@/lib/format";
import type { WalletBundle } from "./load-bundle";
import { cn } from "@/lib/utils";

export function WalletHeader({ bundle }: { bundle: WalletBundle }) {
  const realized = num(bundle.pnl?.realized_pnl) ?? num(bundle.pnl?.pnl) ?? 0;
  const unrealized = num(bundle.pnl?.unrealized_pnl) ?? 0;
  const totalPnl = realized + unrealized;
  const winRate = num(bundle.pnl?.win_rate);

  return (
    <header className="border-b border-border bg-background/60 backdrop-blur sticky top-14 z-20">
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
            <WalletIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-sm bg-secondary/40 rounded px-2 py-1 inline-flex items-center gap-1.5"
                title={bundle.wallet}
              >
                {shortAddr(bundle.wallet, 6, 6)}
                <CopyAddress
                  address={bundle.wallet}
                  className="text-muted-foreground hover:text-foreground"
                />
              </span>
              <WalletChainSelector
                chain={bundle.chain}
                wallet={bundle.wallet}
              />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap mt-1">
              <span className="text-2xl font-semibold tabular-nums">
                {fmtUsd(bundle.netWorthUsd ?? undefined)}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  totalPnl >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                PnL {fmtUsd(totalPnl)}{" "}
                <span className="text-muted-foreground">
                  ({fmtUsd(realized)} realized · {fmtUsd(unrealized)} unrealized)
                </span>
              </span>
              {winRate != null && (
                <span className="text-xs text-muted-foreground">
                  win rate {fmtPct(winRate)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-1 text-xs text-muted-foreground">
              <span>30d</span>
              <NetWorthSparkline
                chain={bundle.chain}
                wallet={bundle.wallet}
                fallbackValue={bundle.netWorthUsd}
              />
            </div>
          </div>
          <div className="shrink-0">
            <VerdictBadge verdict={bundle.verdict} />
          </div>
        </div>
      </div>
    </header>
  );
}
