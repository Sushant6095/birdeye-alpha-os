"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "alphaos:chain";
const DEFAULT_CHAIN = "solana";

interface ChainCtx {
  chain: string;
  setChain: (c: string) => void;
  /** Loaded once on mount via /api/chains. */
  available: string[];
}

const Ctx = createContext<ChainCtx | null>(null);

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [chain, setChainState] = useState(DEFAULT_CHAIN);
  const [available, setAvailable] = useState<string[]>([DEFAULT_CHAIN]);

  // hydrate from localStorage on mount
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v) setChainState(v);
    } catch {
      /* private mode */
    }
  }, []);

  // load available chains
  useEffect(() => {
    let cancelled = false;
    fetch("/api/chains")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const list: string[] = Array.isArray(j?.chains)
          ? j.chains
          : Array.isArray(j)
            ? j
            : [DEFAULT_CHAIN];
        setAvailable(list.length ? list : [DEFAULT_CHAIN]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setChain = useCallback((c: string) => {
    setChainState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* swallow */
    }
  }, []);

  const value = useMemo(
    () => ({ chain, setChain, available }),
    [chain, setChain, available],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChain() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChain must be used inside <ChainProvider>");
  return v;
}
