"use client";

import { useState } from "react";
import {
  DiscoverChips,
  DiscoverFeed,
  type DiscoverTab,
} from "@/components/discover/discover-feed";

export default function DiscoverPage() {
  const [tab, setTab] = useState<DiscoverTab>("trending");
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <p className="text-sm text-muted-foreground">
            Trending, gainers, smart money — across the chain you have selected.
          </p>
        </div>
      </header>
      <DiscoverChips tab={tab} setTab={setTab} />
      <DiscoverFeed tab={tab} />
    </div>
  );
}
