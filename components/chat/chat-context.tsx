"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface ChatCtx {
  open: boolean;
  setOpen: (b: boolean) => void;
  /** Optional starter prompt — set when something else (Whale Radar, a
   *  detail page) wants to seed the chat. */
  pendingPrompt: string | null;
  setPendingPrompt: (s: string | null) => void;
}

const Ctx = createContext<ChatCtx | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const value = useMemo(
    () => ({ open, setOpen, pendingPrompt, setPendingPrompt }),
    [open, pendingPrompt],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChatPanel(): ChatCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChatPanel must be used inside <ChatProvider>");
  return v;
}
