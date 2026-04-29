"use client";

import { Bot } from "lucide-react";

/**
 * AI co-pilot floating button. Wires up in Part 9.
 */
export function ChatFab() {
  return (
    <button
      type="button"
      aria-label="Open AI co-pilot (coming soon)"
      title="AI co-pilot — wired in Part 9"
      className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full border border-border bg-emerald-500/15 text-emerald-300 shadow-lg backdrop-blur hover:bg-emerald-500/25 flex items-center justify-center transition-colors"
    >
      <Bot className="h-5 w-5" />
    </button>
  );
}
