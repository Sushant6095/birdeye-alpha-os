"use client";

import { useEffect, useState, useCallback } from "react";

const KEY = "alphaos:watchlist";

interface Watch {
  chain: string;
  address: string;
  symbol?: string;
}

function load(): Watch[] {
  if (typeof window === "undefined") return [];
  try {
    const v = window.localStorage.getItem(KEY);
    if (!v) return [];
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? (parsed as Watch[]) : [];
  } catch {
    return [];
  }
}

function save(items: Watch[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* swallow */
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<Watch[]>([]);

  useEffect(() => {
    setItems(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((w: Watch) => {
    setItems((prev) => {
      const next = prev.filter(
        (x) =>
          !(
            x.address.toLowerCase() === w.address.toLowerCase() &&
            x.chain === w.chain
          ),
      );
      next.push(w);
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((chain: string, address: string) => {
    setItems((prev) => {
      const next = prev.filter(
        (x) =>
          !(
            x.address.toLowerCase() === address.toLowerCase() &&
            x.chain === chain
          ),
      );
      save(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (chain: string, address: string) =>
      items.some(
        (x) =>
          x.chain === chain &&
          x.address.toLowerCase() === address.toLowerCase(),
      ),
    [items],
  );

  return { items, add, remove, has };
}
