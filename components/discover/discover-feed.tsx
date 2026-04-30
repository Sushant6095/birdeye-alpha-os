"use client";

import { useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useChain } from "@/components/providers/chain-provider";
import { TokenCard, type TokenLike } from "@/components/token/token-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client-fetch";
import {
  nextCursorFromPayload,
  tokensFromPayload,
} from "./normalize";

export type DiscoverTab =
  | "trending"
  | "new-listings"
  | "gainers"
  | "losers"
  | "smart-money"
  | "memes"
  | "by-dex";

export const TABS: { id: DiscoverTab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "new-listings", label: "New Listings" },
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" },
  { id: "smart-money", label: "Smart Money Buys" },
  { id: "memes", label: "Memes" },
  { id: "by-dex", label: "By DEX" },
];

const INFINITE_TABS: ReadonlySet<DiscoverTab> = new Set([
  "trending",
  "gainers",
  "losers",
]);

export function DiscoverFeed({ tab }: { tab: DiscoverTab }) {
  const { chain } = useChain();
  const isInfinite = INFINITE_TABS.has(tab);
  const isPaginated = !isInfinite && tab !== "by-dex" && tab !== "smart-money";

  if (tab === "by-dex") return <ByDexView chain={chain} />;
  if (tab === "smart-money") return <SmartMoneyView chain={chain} />;

  if (isInfinite) {
    return <InfiniteList tab={tab} chain={chain} />;
  }

  // Paginated: simple first-page render
  return <FirstPageList tab={tab} chain={chain} paginated={isPaginated} />;
}

/* ----------------------- helpers ----------------------- */

function endpointFor(tab: DiscoverTab): string {
  if (tab === "smart-money") return "/api/discover/smart-money";
  return `/api/discover/${tab}`;
}

interface PageResponse {
  data: unknown;
  chain: string;
  mode?: "scroll" | "page";
}

function tabLabel(tab: DiscoverTab): string {
  return TABS.find((t) => t.id === tab)?.label ?? tab;
}

async function fetchPage(
  tab: DiscoverTab,
  chain: string,
  param: { offset?: number; cursor?: string; limit?: number } = {},
): Promise<PageResponse> {
  const usp = new URLSearchParams({ chain });
  if (param.cursor) usp.set("cursor", param.cursor);
  if (param.offset != null) usp.set("offset", String(param.offset));
  if (param.limit != null) usp.set("limit", String(param.limit));
  return apiFetch<PageResponse>(`${endpointFor(tab)}?${usp.toString()}`, {
    toastTitle: `Couldn't load ${tabLabel(tab)} on ${chain}`,
  });
}

/* ----------------------- views ----------------------- */

function InfiniteList({
  tab,
  chain,
}: {
  tab: DiscoverTab;
  chain: string;
}) {
  const query = useInfiniteQuery<
    PageResponse,
    Error,
    InfiniteData<PageResponse>,
    [string, DiscoverTab, string],
    { offset?: number; cursor?: string }
  >({
    queryKey: ["discover", tab, chain],
    initialPageParam: { offset: 0 },
    queryFn: ({ pageParam }) => {
      const limit = tab === "trending" ? 20 : 30;
      return fetchPage(tab, chain, { ...pageParam, limit });
    },
    getNextPageParam: (last, allPages) => {
      const cursor = nextCursorFromPayload(last.data);
      if (cursor) return { cursor };
      const pageSize = tab === "trending" ? 20 : 30;
      const total = allPages.reduce(
        (n, p) => n + tokensFromPayload(p.data).length,
        0,
      );
      const lastBatch = tokensFromPayload(last.data).length;
      if (lastBatch < pageSize) return undefined;
      return { offset: total };
    },
  });

  const tokens = (query.data?.pages ?? []).flatMap((p) =>
    tokensFromPayload(p.data),
  );

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !query.hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, query]);

  return (
    <div className="space-y-2">
      {query.isLoading && <ListSkeleton />}
      {query.error && (
        <p className="text-sm text-red-400">{query.error.message}</p>
      )}
      {tokens.map((t, i) => (
        <TokenCard
          key={`${t.address}-${i}`}
          token={t}
          chain={chain}
          rank={i + 1}
        />
      ))}
      <div ref={sentinel} />
      {query.isFetchingNextPage && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          Loading more…
        </p>
      )}
      {!query.hasNextPage && tokens.length > 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          End of feed.
        </p>
      )}
    </div>
  );
}

function FirstPageList({
  tab,
  chain,
  paginated,
}: {
  tab: DiscoverTab;
  chain: string;
  paginated: boolean;
}) {
  const query = useQuery<PageResponse, Error>({
    queryKey: ["discover", tab, chain, "first"],
    queryFn: () =>
      fetchPage(tab, chain, paginated ? { offset: 0, limit: 30 } : { limit: 30 }),
  });

  const tokens = tokensFromPayload(query.data?.data);

  return (
    <div className="space-y-2">
      {query.isLoading && <ListSkeleton />}
      {query.error && (
        <p className="text-sm text-red-400">{query.error.message}</p>
      )}
      {tokens.map((t, i) => (
        <TokenCard
          key={`${t.address}-${i}`}
          token={t}
          chain={chain}
          rank={i + 1}
        />
      ))}
      {!query.isLoading && tokens.length === 0 && (
        <p className="text-sm text-muted-foreground">No results.</p>
      )}
    </div>
  );
}

function SmartMoneyView({ chain }: { chain: string }) {
  // Smart-money endpoint returns wallet rankings; we attempt to surface
  // the tokens they're buying. Best-effort: render whatever the API gave us.
  const query = useQuery<PageResponse, Error>({
    queryKey: ["discover", "smart-money", chain],
    queryFn: () =>
      fetchPage("smart-money", chain, { offset: 0, limit: 30 }),
  });

  const items = tokensFromPayload(query.data?.data);

  return (
    <div className="space-y-2">
      {query.isLoading && <ListSkeleton />}
      {query.error && (
        <p className="text-sm text-red-400">{query.error.message}</p>
      )}
      {items.map((t, i) => (
        <TokenCard
          key={`${t.address ?? "row"}-${i}`}
          token={{ ...t, smartMoney: true }}
          chain={chain}
          rank={i + 1}
        />
      ))}
      {!query.isLoading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No smart-money signal returned. The Birdeye payload is preserved
          server-side; verify with{" "}
          <code className="text-xs">/api/discover/smart-money</code>.
        </p>
      )}
    </div>
  );
}

function ByDexView({ chain }: { chain: string }) {
  const query = useQuery<
    {
      chain: string;
      address: string;
      groups: Record<string, Record<string, unknown>[]>;
      total: number;
    },
    Error
  >({
    queryKey: ["discover", "by-dex", chain],
    queryFn: async () => {
      const r = await fetch(`/api/discover/by-dex?chain=${encodeURIComponent(chain)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.error)
    return <p className="text-sm text-red-400">{query.error.message}</p>;

  const groups = query.data?.groups ?? {};
  const sorted = Object.entries(groups).sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Markets for {query.data?.address.slice(0, 6)}…{" "}
        {query.data?.address.slice(-4)} grouped by DEX. Total markets:{" "}
        {query.data?.total ?? 0}.
      </p>
      {sorted.map(([dex, items]) => (
        <section key={dex}>
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {dex} · {items.length}
          </h3>
          <ul className="space-y-1 text-xs font-mono">
            {items.slice(0, 10).map((m, i) => (
              <li
                key={i}
                className="border border-border rounded-md bg-secondary/30 px-3 py-2 flex justify-between gap-3"
              >
                <span className="truncate">
                  {String(m["address"] ?? "—")}
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">
                  liq{" "}
                  {Number(m["liquidity"] ?? 0).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function DiscoverChips({
  tab,
  setTab,
}: {
  tab: DiscoverTab;
  setTab: (t: DiscoverTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={cn(
            "rounded-full border border-border px-3 h-8 text-xs transition-colors",
            tab === t.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
