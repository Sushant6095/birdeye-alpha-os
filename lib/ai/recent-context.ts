"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "alphaos:recent-context";

export interface RecentContext {
  chain: string;
  recentToken?: string;
  recentWallet?: string;
  /** raw last visited URL — useful for debugging. */
  lastPath?: string;
}

function loadStored(): RecentContext | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (!v) return null;
    return JSON.parse(v) as RecentContext;
  } catch {
    return null;
  }
}

function save(ctx: RecentContext) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    /* swallow */
  }
}

const TOKEN_RE = /^\/token\/([^/]+)\/([^/?#]+)/;
const WALLET_RE = /^\/wallet\/([^/]+)\/([^/?#]+)/;
const PAIR_RE = /^\/pair\/([^/]+)\/([^/?#]+)/;

/**
 * Tracks the last token / wallet / chain the user has been looking at, so
 * the chat panel can answer "is this safe?" without forcing the user to
 * re-paste an address.
 */
export function useRecentContext(): RecentContext {
  const pathname = usePathname();
  const [ctx, setCtx] = useState<RecentContext>(() => ({
    chain: loadStored()?.chain ?? "solana",
    recentToken: loadStored()?.recentToken,
    recentWallet: loadStored()?.recentWallet,
  }));

  useEffect(() => {
    if (!pathname) return;
    const next: RecentContext = { ...ctx, lastPath: pathname };
    let m = pathname.match(TOKEN_RE);
    if (m) {
      next.chain = m[1] ?? next.chain;
      next.recentToken = m[2];
    }
    m = pathname.match(WALLET_RE);
    if (m) {
      next.chain = m[1] ?? next.chain;
      next.recentWallet = m[2];
    }
    m = pathname.match(PAIR_RE);
    if (m) {
      next.chain = m[1] ?? next.chain;
    }
    setCtx(next);
    save(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return ctx;
}
