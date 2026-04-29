"use client";

import { Command } from "cmdk";
import { Coins, FileText, Wallet, Search as SearchIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChain } from "@/components/providers/chain-provider";
import { useQuery } from "@tanstack/react-query";

interface SearchHit {
  type?: string;
  result_type?: string;
  address?: string;
  symbol?: string;
  name?: string;
  logo_uri?: string;
  price?: number;
  market_cap?: number;
  liquidity?: number;
}

const ICONS: Record<string, typeof Coins> = {
  token: Coins,
  pair: FileText,
  market: FileText,
  wallet: Wallet,
};

interface PaletteProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function SearchPalette({ open, setOpen }: PaletteProps) {
  const { chain } = useChain();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", chain, query],
    queryFn: async () => {
      if (!query || query.length < 2) return { items: [] as SearchHit[] };
      const url = `/api/search?chain=${encodeURIComponent(chain)}&q=${encodeURIComponent(query)}&limit=8`;
      const r = await fetch(url);
      const j = (await r.json()) as { items?: unknown };
      const raw = Array.isArray(j.items) ? j.items : [];
      const flat: SearchHit[] = [];
      for (const item of raw) {
        if (typeof item !== "object" || item == null) continue;
        const inner = (item as { result?: unknown[] }).result;
        if (Array.isArray(inner)) {
          for (const r of inner) flat.push(r as SearchHit);
        } else {
          flat.push(item as SearchHit);
        }
      }
      return { items: flat };
    },
    staleTime: 5 * 60_000,
    enabled: query.length >= 2,
  });

  function go(hit: SearchHit) {
    if (!hit.address) return;
    const type = (hit.type ?? hit.result_type ?? "token").toLowerCase();
    if (type.startsWith("wallet")) {
      router.push(`/wallet/${chain}/${hit.address}`);
    } else if (type.startsWith("pair") || type.startsWith("market")) {
      router.push(`/pair/${chain}/${hit.address}`);
    } else {
      router.push(`/token/${chain}/${hit.address}`);
    }
    setOpen(false);
    setQuery("");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(640px,90vw)] rounded-lg border border-border bg-background shadow-2xl overflow-hidden"
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search tokens, pairs, wallets…"
              className="flex h-12 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
              esc
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {query.length < 2 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Type at least 2 characters…
              </p>
            )}
            {query.length >= 2 && isFetching && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Searching…
              </p>
            )}
            {query.length >= 2 &&
              !isFetching &&
              data?.items?.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No matches.
                </p>
              )}
            {data?.items?.map((hit, i) => {
              const type = (
                hit.type ??
                hit.result_type ??
                "token"
              ).toLowerCase();
              const Icon = ICONS[type] ?? Coins;
              return (
                <Command.Item
                  key={`${hit.address}-${i}`}
                  value={`${hit.symbol ?? ""} ${hit.name ?? ""} ${hit.address ?? ""}`}
                  onSelect={() => go(hit)}
                  className="flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-secondary"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">
                      {hit.symbol ?? hit.name ?? hit.address}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {hit.name && hit.symbol ? hit.name + " · " : ""}
                      {hit.address}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {type}
                  </span>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
