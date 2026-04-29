"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Star, Volume2, VolumeX } from "lucide-react";
import { useChain } from "@/components/providers/chain-provider";
import { useLargeTradeStream } from "@/lib/ws/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtTimeAgo, fmtUsd, num, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBatchedBuffer } from "@/components/tape/use-batched-buffer";
import { useWatchlist } from "./watchlist-store";
import { whaleBeep } from "./sound";

interface WhaleTx {
  txHash?: string;
  blockUnixTime?: number;
  side?: string;
  source?: string;
  owner?: string;
  volumeUsd?: number;
  base?: { address?: string; symbol?: string };
  quote?: { address?: string; symbol?: string };
  address?: string;
}

const MAX = 50;

export function WhalesPage() {
  const { chain } = useChain();
  const [threshold, setThreshold] = useState(50_000);
  const [sound, setSound] = useState(true);
  const [telegram, setTelegram] = useState(false);
  const [watchOnly, setWatchOnly] = useState(false);
  const watch = useWatchlist();

  const { items, push, reset } = useBatchedBuffer<WhaleTx>(MAX);
  const seen = useRef<Set<string>>(new Set());
  const aiCooldown = useRef<Map<string, number>>(new Map());
  const [aiVerdicts, setAiVerdicts] = useState<Map<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    reset();
    seen.current.clear();
    aiCooldown.current.clear();
    setAiVerdicts(new Map());
  }, [chain, threshold, reset]);

  const stream = useLargeTradeStream(chain, threshold);
  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const t = ev.data as WhaleTx;
    const key = t.txHash ?? `${t.blockUnixTime}-${Math.random()}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);

    const tokenAddr =
      t.address ?? t.base?.address ?? t.quote?.address ?? "";
    const isWatched = !!tokenAddr && watch.has(chain, tokenAddr);

    if (watchOnly && !isWatched) return;

    push(t);

    if (sound) whaleBeep({ highPitch: isWatched });
    if (telegram) {
      const text = `🐋 *${t.base?.symbol ?? "—"}* ${t.side ?? "trade"} ${fmtUsd(num(t.volumeUsd))} on ${chain}${isWatched ? " · *watchlist*" : ""}`;
      void fetch("/api/whales/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          meta: { chain, txHash: t.txHash, owner: t.owner, isWatched },
        }),
      }).catch(() => {});
    }

    if (isWatched && tokenAddr) {
      // Cap to 1 AI call per token per 30s to control cost.
      const tokenKey = tokenAddr.toLowerCase();
      const last = aiCooldown.current.get(tokenKey) ?? 0;
      const now = Date.now();
      if (now - last >= 30_000) {
        aiCooldown.current.set(tokenKey, now);
        void fetch("/api/chat/quick-verdict", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chain,
            address: tokenAddr,
            side: t.side,
            volumeUsd: num(t.volumeUsd),
            owner: t.owner,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((j: { verdict?: string | null } | null) => {
            const verdict = j?.verdict;
            if (!verdict) return;
            setAiVerdicts((m) => {
              const next = new Map(m);
              next.set(tokenKey, verdict);
              return next;
            });
          })
          .catch(() => {});
      }
    }
  }, [stream.data, chain, sound, telegram, watchOnly, watch, push, threshold]);

  const visible = useMemo(() => items.slice(0, MAX), [items]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Whale Radar</h1>
          <p className="text-sm text-muted-foreground">
            Last {MAX} whale txs on {chain}. WS topic{" "}
            <code className="text-foreground">large_trade</code>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              stream.status === "open"
                ? "text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                stream.status === "open"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-muted-foreground/40",
              )}
            />
            ws {stream.status}
          </span>
        </div>
      </header>

      <div className="rounded-md border bg-secondary/20 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs items-end">
        <Field label="Threshold (USD)">
          <Input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value) || 0)}
            className="h-8"
          />
        </Field>
        <Field label="Sound">
          <Button
            variant={sound ? "default" : "secondary"}
            size="sm"
            onClick={() => setSound((s) => !s)}
            className="gap-1"
          >
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {sound ? "on" : "off"}
          </Button>
        </Field>
        <Field label="Telegram push">
          <Button
            variant={telegram ? "default" : "secondary"}
            size="sm"
            onClick={() => setTelegram((s) => !s)}
            className="gap-1"
            title="Requires TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env"
          >
            {telegram ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {telegram ? "armed" : "off"}
          </Button>
        </Field>
        <Field label="Watchlist mode">
          <Button
            variant={watchOnly ? "default" : "secondary"}
            size="sm"
            onClick={() => setWatchOnly((s) => !s)}
            className="gap-1"
            disabled={watch.items.length === 0}
            title={
              watch.items.length === 0
                ? "Add tokens to watchlist first"
                : `${watch.items.length} tokens watched`
            }
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                watchOnly && "fill-amber-300 text-amber-300",
              )}
            />
            {watchOnly ? "on" : "off"}
          </Button>
        </Field>
      </div>

      <div className="rounded-md border bg-secondary/20 p-3">
        <ul className="divide-y divide-border/40">
          {visible.map((t, i) => (
            <WhaleRow
              key={t.txHash ?? `${t.blockUnixTime}-${i}`}
              t={t}
              chain={chain}
              aiVerdict={aiVerdicts.get(
                (
                  t.address ??
                  t.base?.address ??
                  t.quote?.address ??
                  ""
                ).toLowerCase(),
              )}
              watched={watch.has(
                chain,
                t.address ?? t.base?.address ?? t.quote?.address ?? "",
              )}
              onWatch={() => {
                const addr =
                  t.address ?? t.base?.address ?? t.quote?.address ?? "";
                if (!addr) return;
                if (watch.has(chain, addr)) {
                  watch.remove(chain, addr);
                } else {
                  watch.add({
                    chain,
                    address: addr,
                    symbol: t.base?.symbol ?? t.quote?.symbol,
                  });
                }
              }}
            />
          ))}
          {visible.length === 0 && (
            <li className="text-xs text-muted-foreground py-3 text-center">
              Listening for whales ≥ {fmtUsd(threshold)} on {chain}…
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function WhaleRow({
  t,
  chain,
  watched,
  onWatch,
  aiVerdict,
}: {
  t: WhaleTx;
  chain: string;
  watched: boolean;
  onWatch: () => void;
  aiVerdict?: string;
}) {
  const side = (t.side ?? "").toLowerCase();
  const positive = side === "buy";
  const tokenAddr =
    t.address ?? t.base?.address ?? t.quote?.address ?? "";
  const sym = t.base?.symbol ?? t.quote?.symbol ?? "—";
  return (
    <li className="py-2 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground tabular-nums w-12 shrink-0">
          {fmtTimeAgo(num(t.blockUnixTime))}
        </span>
        <span
          className={cn(
            "uppercase text-[10px] w-10 shrink-0",
            positive ? "text-emerald-400" : "text-red-400",
          )}
        >
          {side || "—"}
        </span>
        <Link
          href={`/token/${chain}/${tokenAddr}`}
          className="hover:text-foreground"
        >
          {sym}
        </Link>
        <button
          onClick={onWatch}
          className="text-muted-foreground hover:text-amber-300"
          aria-label="watchlist"
          title={watched ? "remove from watchlist" : "add to watchlist"}
        >
          <Star
            className={cn(
              "h-3 w-3",
              watched && "fill-amber-300 text-amber-300",
            )}
          />
        </button>
        <span className="text-muted-foreground w-16 truncate">
          {String(t.source ?? "—")}
        </span>
        <Link
          href={`/wallet/${chain}/${t.owner ?? ""}`}
          className="flex-1 truncate hover:text-foreground text-muted-foreground"
        >
          {shortAddr(t.owner, 4, 4)}
        </Link>
        <span className="tabular-nums w-24 text-right inline-flex items-center justify-end gap-1">
          🐋 {fmtUsd(num(t.volumeUsd))}
        </span>
      </div>
      {aiVerdict && (
        <p className="ml-12 mt-1 text-[10px] text-amber-300/90 font-sans inline-flex items-start gap-1">
          <span aria-hidden>🤖</span>
          <span>{aiVerdict}</span>
        </p>
      )}
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
