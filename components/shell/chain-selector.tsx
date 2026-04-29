"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChain } from "@/components/providers/chain-provider";

export function ChainSelector() {
  const { chain, setChain, available } = useChain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 h-9 text-sm hover:bg-secondary"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="capitalize">{chain}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-md border border-border bg-background shadow-lg py-1 z-50 max-h-72 overflow-auto">
          {available.map((c) => (
            <button
              key={c}
              onClick={() => {
                setChain(c);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm capitalize hover:bg-secondary",
                c === chain && "bg-secondary text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
