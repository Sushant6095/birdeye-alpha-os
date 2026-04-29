"use client";

import type { RecentContext } from "@/lib/ai/recent-context";
import { shortAddr } from "@/lib/format";

interface Props {
  context: RecentContext;
  onPick: (prompt: string) => void;
}

export function SuggestedPrompts({ context, onPick }: Props) {
  const items: string[] = [];
  if (context.recentToken) {
    items.push(
      `Is the token at ${shortAddr(context.recentToken, 4, 4)} on ${context.chain} safe to buy?`,
    );
  }
  if (context.recentWallet) {
    items.push(
      `Profile this wallet on ${context.chain}: ${shortAddr(context.recentWallet, 4, 4)}`,
    );
  }
  items.push("What's smart money buying on Solana right now?");
  if (context.recentToken) {
    items.push(
      `Compare ${shortAddr(context.recentToken, 4, 4)} against the top trending token on ${context.chain}.`,
    );
  } else {
    items.push("Compare BONK and WIF on Solana.");
  }
  items.push(
    `Find me new ${context.chain} tokens with whale activity in the last hour.`,
  );

  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.slice(0, 5).map((p) => (
        <button
          key={p}
          onClick={() => onPick(p)}
          className="text-[11px] rounded-full border border-border bg-secondary/40 hover:bg-secondary px-2.5 h-7 truncate max-w-full text-left"
          title={p}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
