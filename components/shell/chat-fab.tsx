"use client";

import { Bot } from "lucide-react";
import { useChatPanel } from "@/components/chat/chat-context";

/** AI co-pilot floating button — opens the chat panel. */
export function ChatFab() {
  const { open, setOpen } = useChatPanel();
  if (open) return null;
  return (
    <button
      type="button"
      aria-label="Open AI co-pilot"
      onClick={() => setOpen(true)}
      className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full border border-border bg-emerald-500/15 text-emerald-300 shadow-lg backdrop-blur hover:bg-emerald-500/25 flex items-center justify-center transition-colors"
    >
      <Bot className="h-5 w-5" />
    </button>
  );
}
