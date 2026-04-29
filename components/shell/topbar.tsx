"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ChainSelector } from "./chain-selector";
import { CreditGauge } from "./credit-gauge";
import { SearchPalette } from "./search-palette";

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iP(od|ad|hone)/.test(navigator.platform));
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center gap-3 px-4">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 h-9 max-w-md flex-1 rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground hover:bg-secondary"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search tokens, pairs, wallets…</span>
          <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        </button>
        <div className="flex-1" />
        <CreditGauge />
        <ChainSelector />
      </header>
      <SearchPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </>
  );
}
