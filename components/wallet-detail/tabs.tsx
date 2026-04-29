"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HoldingsTab } from "./holdings-tab";
import { PnLTab } from "./pnl-tab";
import { TransactionsTab } from "./transactions-tab";
import { TransfersTab } from "./transfers-tab";
import { OriginTab } from "./origin-tab";
import type { WalletBundle } from "./load-bundle";

const TABS = [
  { id: "holdings", label: "Holdings" },
  { id: "pnl", label: "PnL" },
  { id: "txs", label: "Transactions" },
  { id: "transfers", label: "Transfers" },
  { id: "origin", label: "Origin" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function WalletTabs({ bundle }: { bundle: WalletBundle }) {
  const [tab, setTab] = useState<TabId>("holdings");
  return (
    <div>
      <nav className="border-b border-border px-4 sm:px-6 flex gap-2 overflow-x-auto sticky top-[7.5rem] z-10 bg-background/80 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 px-3 text-sm border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-emerald-400 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="px-4 sm:px-6 py-4">
        {tab === "holdings" && (
          <HoldingsTab
            chain={bundle.chain}
            wallet={bundle.wallet}
            initial={bundle.portfolio}
          />
        )}
        {tab === "pnl" && (
          <PnLTab chain={bundle.chain} wallet={bundle.wallet} />
        )}
        {tab === "txs" && (
          <TransactionsTab chain={bundle.chain} wallet={bundle.wallet} />
        )}
        {tab === "transfers" && (
          <TransfersTab chain={bundle.chain} wallet={bundle.wallet} />
        )}
        {tab === "origin" && (
          <OriginTab chain={bundle.chain} wallet={bundle.wallet} />
        )}
      </div>
    </div>
  );
}
