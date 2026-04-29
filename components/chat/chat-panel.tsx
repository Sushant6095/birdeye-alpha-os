"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Send, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatPanel } from "./chat-context";
import { useChain } from "@/components/providers/chain-provider";
import { useRecentContext } from "@/lib/ai/recent-context";
import { MessageBody } from "./message-renderer";
import { SuggestedPrompts } from "./suggested-prompts";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const { open, setOpen, pendingPrompt, setPendingPrompt } = useChatPanel();
  const { chain } = useChain();
  const recent = useRecentContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");

  const transportBody = useMemo(
    () => ({ chain, recentToken: recent.recentToken, recentWallet: recent.recentWallet }),
    [chain, recent.recentToken, recent.recentWallet],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: useMemo(
      () =>
        new DefaultChatTransport({
          api: "/api/chat",
          body: () => transportBody,
        }),
      [transportBody],
    ),
  });

  // Persist messages to /api/conversations on each settle
  const lastSavedLen = useRef(0);
  useEffect(() => {
    if (status !== "ready") return;
    if (messages.length === 0) return;
    if (messages.length === lastSavedLen.current) return;
    lastSavedLen.current = messages.length;
    void persist(conversationId, messages, setConversationId);
  }, [status, messages, conversationId]);

  // pending prompts (e.g. from Whale Radar)
  useEffect(() => {
    if (!open || !pendingPrompt) return;
    const p = pendingPrompt;
    setPendingPrompt(null);
    void sendMessage({ text: p });
  }, [open, pendingPrompt, sendMessage, setPendingPrompt]);

  const send = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      setComposer("");
      void sendMessage({ text: t });
    },
    [sendMessage],
  );

  const newChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    lastSavedLen.current = 0;
  }, [setMessages]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // tally tool-calls + chars for the cost footer
  const stats = useMemo(() => {
    let toolCalls = 0;
    let chars = 0;
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type === "text") chars += part.text.length;
        if (part.type.startsWith("tool-")) toolCalls += 1;
      }
    }
    return { toolCalls, chars };
  }, [messages]);

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "fixed top-0 right-0 bottom-0 z-50 w-[min(480px,100vw)] border-l border-border bg-background shadow-2xl flex flex-col transition-transform",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <header className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">AlphaOS analyst</span>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider",
              status === "streaming" && "text-emerald-400",
              status === "submitted" && "text-amber-300",
              status === "error" && "text-red-400",
              status === "ready" && "text-muted-foreground",
            )}
          >
            {status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={newChat}
            className="text-muted-foreground hover:text-foreground"
            title="new chat"
            aria-label="new chat"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
            <p className="text-sm max-w-[320px]">
              Ask anything. The agent has tool access to the entire Birdeye
              REST surface and can call ~78 endpoints in parallel.
            </p>
            <div className="w-full max-w-[420px]">
              <SuggestedPrompts context={recent} onPick={send} />
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageView key={m.id} message={m} />)
        )}
        {status === "streaming" && (
          <div className="text-xs text-muted-foreground">…</div>
        )}
      </div>

      <footer className="border-t border-border p-2 space-y-2 shrink-0">
        {messages.length > 0 && (
          <SuggestedPrompts context={recent} onPick={send} />
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(composer);
          }}
          className="flex gap-2"
        >
          <Input
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Ask the AlphaOS analyst…"
            disabled={status === "streaming"}
          />
          {status === "streaming" ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={stop}
              title="stop"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!composer.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
        <p className="text-[10px] text-muted-foreground flex items-center justify-between">
          <span>
            {messages.length} msgs · {stats.toolCalls} tool calls ·{" "}
            {Math.round(stats.chars / 4).toLocaleString()} ~tokens
          </span>
          <span title="hard cap on tool calls per user message">cap 12</span>
        </p>
      </footer>
    </aside>
  );
}

async function persist(
  id: string | null,
  messages: UIMessage[],
  setId: (s: string) => void,
) {
  try {
    if (id == null) {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: messageSnippet(messages[0]) ?? "New chat",
          messages,
        }),
      });
      if (!r.ok) return;
      const j = (await r.json()) as { row?: { id: string } };
      if (j.row?.id) setId(j.row.id);
      return;
    }
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    /* offline / DB not configured — chat still works in memory */
  }
}

function messageSnippet(m: UIMessage | undefined): string | undefined {
  if (!m) return undefined;
  for (const part of m.parts) {
    if (part.type === "text") return part.text.slice(0, 80);
  }
  return undefined;
}

function MessageView({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = textOf(message);
  const tools = message.parts.filter((p) => p.type.startsWith("tool-"));
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "rounded-md px-3 py-2 max-w-[95%] border",
          isUser
            ? "bg-primary text-primary-foreground border-transparent"
            : "bg-secondary/30 border-border",
        )}
      >
        {text ? (
          <MessageBody text={text} />
        ) : (
          <span className="text-xs text-muted-foreground">…</span>
        )}
      </div>
      {tools.length > 0 && (
        <details className="text-[10px] text-muted-foreground">
          <summary className="cursor-pointer">
            {tools.length} tool call{tools.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1 font-mono pl-2">
            {tools.map((t, i) => (
              <li key={i}>{t.type.replace(/^tool-/, "")}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function textOf(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}
