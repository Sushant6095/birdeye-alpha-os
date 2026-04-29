"use client";

import { Star } from "lucide-react";
import { useWatchlists, type WatchItem } from "@/lib/watchlist/hooks";
import { cn } from "@/lib/utils";

/**
 * Reusable "Add to watchlist" button. Toggles the (chain,address) pair into
 * the user's first watchlist (creating "Default" if there are none yet).
 */
export function AddToWatchlistButton({
  item,
  className,
  size = "sm",
}: {
  item: WatchItem;
  className?: string;
  size?: "sm" | "md";
}) {
  const { list, toggleAcrossAll } = useWatchlists();
  const lists = list.data?.items ?? [];
  const isWatched = lists.some((l) =>
    l.items.some(
      (i) =>
        i.chain === item.chain &&
        i.address.toLowerCase() === item.address.toLowerCase(),
    ),
  );

  return (
    <button
      onClick={() => toggleAcrossAll(item)}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-xs",
        size === "sm" ? "h-7 px-2" : "h-8 px-3",
        isWatched && "border-amber-300/40",
        className,
      )}
      title={isWatched ? "remove from watchlist" : "add to watchlist"}
    >
      <Star
        className={cn(
          "h-3.5 w-3.5",
          isWatched && "fill-amber-300 text-amber-300",
        )}
      />
      {isWatched ? "Watched" : "Watch"}
    </button>
  );
}
