"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface WatchItem {
  chain: string;
  address: string;
  symbol?: string;
  kind?: "token" | "wallet" | "pair";
  addedAt?: string;
}

export interface WatchlistRow {
  id: string;
  name: string;
  items: WatchItem[];
  createdAt: string;
  updatedAt: string;
}

export function useWatchlists() {
  const qc = useQueryClient();
  const list = useQuery<{ items: WatchlistRow[] }>({
    queryKey: ["watchlists"],
    queryFn: async () => {
      const r = await fetch("/api/watchlists");
      if (!r.ok) throw new Error(`watchlists ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; items?: WatchItem[] }) => {
      const r = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) throw new Error(`create ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      items?: WatchItem[];
    }) => {
      const r = await fetch(`/api/watchlists/${input.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) throw new Error(`update ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/watchlists/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`delete ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });

  /** Convenience: toggle membership of one (chain, address) pair across all lists. */
  const toggleAcrossAll = async (
    item: WatchItem,
    targetListId?: string,
  ) => {
    const items = list.data?.items ?? [];
    const list0 =
      items.find((l) => l.id === targetListId) ?? items[0] ?? null;
    if (!list0) {
      await create.mutateAsync({
        name: "Default",
        items: [{ ...item, addedAt: new Date().toISOString() }],
      });
      return;
    }
    const present = list0.items.some(
      (i) =>
        i.chain === item.chain &&
        i.address.toLowerCase() === item.address.toLowerCase(),
    );
    const next = present
      ? list0.items.filter(
          (i) =>
            !(
              i.chain === item.chain &&
              i.address.toLowerCase() === item.address.toLowerCase()
            ),
        )
      : [...list0.items, { ...item, addedAt: new Date().toISOString() }];
    await update.mutateAsync({ id: list0.id, items: next });
  };

  return { list, create, update, remove, toggleAcrossAll };
}

export function flatten(lists: WatchlistRow[] | undefined): WatchItem[] {
  if (!lists) return [];
  const seen = new Set<string>();
  const out: WatchItem[] = [];
  for (const l of lists) {
    for (const it of l.items ?? []) {
      const key = `${it.chain}:${it.address.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}
