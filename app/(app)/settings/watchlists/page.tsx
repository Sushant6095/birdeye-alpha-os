"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWatchlists,
  type WatchItem,
  type WatchlistRow,
} from "@/lib/watchlist/hooks";

export default function WatchlistsPage() {
  const { list, create, update, remove } = useWatchlists();
  const [name, setName] = useState("");

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlists</h1>
        <p className="text-sm text-muted-foreground">
          Up to 50 tokens or wallets per list. Star buttons across the app
          toggle membership in your first list (auto-created if none exist).
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (!n) return;
          create.mutate({ name: n, items: [] });
          setName("");
        }}
        className="flex gap-2"
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New watchlist name…"
          maxLength={64}
        />
        <Button type="submit" className="gap-1">
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </form>

      {list.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}
      {list.error && (
        <p className="text-xs text-red-400">{(list.error as Error).message}</p>
      )}

      <div className="space-y-3">
        {(list.data?.items ?? []).map((row) => (
          <WatchlistCard
            key={row.id}
            row={row}
            onRemoveItem={(it) => {
              const next = row.items.filter(
                (i) =>
                  !(
                    i.chain === it.chain &&
                    i.address.toLowerCase() === it.address.toLowerCase()
                  ),
              );
              update.mutate({ id: row.id, items: next });
            }}
            onDelete={() => remove.mutate(row.id)}
          />
        ))}
        {!list.isLoading && (list.data?.items?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">No watchlists yet.</p>
        )}
      </div>
    </div>
  );
}

function WatchlistCard({
  row,
  onRemoveItem,
  onDelete,
}: {
  row: WatchlistRow;
  onRemoveItem: (i: WatchItem) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-md border bg-secondary/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{row.name}</h3>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{row.items.length}/50</span>
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-red-400"
            aria-label="delete watchlist"
            title="delete watchlist"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {row.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Empty — use the ⭐ button on any Token Lens or Wallet Profiler to add.
        </p>
      ) : (
        <ul className="divide-y divide-border/40 text-xs">
          {row.items.map((it, i) => (
            <li
              key={`${it.chain}-${it.address}-${i}`}
              className="flex items-center justify-between gap-2 py-2"
            >
              <Link
                href={
                  it.kind === "wallet"
                    ? `/wallet/${it.chain}/${it.address}`
                    : `/token/${it.chain}/${it.address}`
                }
                className="flex-1 min-w-0 truncate hover:text-foreground"
              >
                <span className="capitalize text-muted-foreground mr-2">
                  {it.chain}
                </span>
                <span className="font-mono">{it.symbol ?? it.address}</span>
              </Link>
              <button
                onClick={() => onRemoveItem(it)}
                className="text-muted-foreground hover:text-red-400"
                aria-label="remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
