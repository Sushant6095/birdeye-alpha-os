"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChain } from "@/components/providers/chain-provider";
import { ChainBadge, getChainMeta } from "@/components/landing/chain-badge";

export function ChainSelector() {
  const { chain, setChain, available } = useChain();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onClick);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return available;
    return available.filter((c) => {
      const meta = getChainMeta(c);
      return (
        c.toLowerCase().includes(term) ||
        meta.label.toLowerCase().includes(term) ||
        meta.symbol.toLowerCase().includes(term)
      );
    });
  }, [available, q]);

  const activeMeta = getChainMeta(chain);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex h-9 items-center gap-2 rounded-lg border bg-secondary/40 px-2 pr-2.5 text-sm transition-all",
          open
            ? "border-sky-400/50 bg-secondary glow-mint-sm"
            : "border-border hover:border-sky-400/30 hover:bg-secondary",
        )}
      >
        <ChainBadge chain={chain} size="sm" />
        <span className="font-medium tracking-tight">{activeMeta.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180 text-sky-400",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl surface p-2 shadow-2xl fade-in-up">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chain…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-2 max-h-72 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No chains match "{q}"
              </div>
            ) : (
              filtered.map((c) => {
                const meta = getChainMeta(c);
                const active = c === chain;
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setChain(c);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sky-400/10 text-sky-300"
                        : "hover:bg-secondary",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <ChainBadge chain={c} size="sm" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-medium">{meta.label}</span>
                        <span className="text-[10px] tracking-wider text-muted-foreground">
                          {meta.symbol}
                        </span>
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 text-sky-400" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2 border-t border-border pt-2 text-[10px] uppercase tracking-[.16em] text-muted-foreground/70">
            {available.length} chains · synced via /api/chains
          </div>
        </div>
      )}
    </div>
  );
}
