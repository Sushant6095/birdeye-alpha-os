"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useLargeTradeStream,
  useNewListingStream,
  useNewPairStream,
  useTokenStatsStream,
  useWalletTxStream,
} from "@/lib/ws/hooks";
import { useToast } from "./toast-host";
import type {
  AlertKind,
  AlertRule,
  NewListingConfig,
  NewPairConfig,
  TokenStatsThresholdConfig,
  WalletActivityConfig,
  WhaleOnWatchlistConfig,
} from "@/lib/alerts/types";
import { useUser } from "@/components/providers/user-provider";

/**
 * Browser-side alert engine.
 *
 * Mounted once in (app)/layout. While the tab is open, subscribes to the WS
 * topics any active rule needs and evaluates predicates locally. On a hit
 * we fire a toast and POST /api/alerts/fire so the alert lands in DB and
 * (optionally) Telegram.
 *
 * One open tab is enough to drive alerts under 3s end-to-end. Production
 * deployments would lift this evaluator to a worker; the predicate code is
 * pure and trivially portable.
 */
export function AlertEngine() {
  const user = useUser();
  const enabled = !!user;

  const { data } = useQuery<{ items: AlertRule[] }>({
    queryKey: ["alert-rules"],
    queryFn: async () => {
      const r = await fetch("/api/alerts");
      if (!r.ok) return { items: [] };
      return r.json();
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const rules = (data?.items ?? []).filter((r) => r.enabled);

  const partition = useMemo(() => {
    const buckets: Record<AlertKind, AlertRule[]> = {
      wallet_activity: [],
      new_listing: [],
      new_pair: [],
      whale_on_watchlist: [],
      token_stats_threshold: [],
    };
    for (const r of rules) buckets[r.type]?.push(r);
    return buckets;
  }, [rules]);

  return (
    <>
      {partition.wallet_activity.map((r) => (
        <WalletActivityWatcher key={r.id} rule={r} />
      ))}
      {partition.new_listing.map((r) => (
        <NewListingWatcher key={r.id} rule={r} />
      ))}
      {partition.new_pair.map((r) => (
        <NewPairWatcher key={r.id} rule={r} />
      ))}
      {partition.whale_on_watchlist.map((r) => (
        <WhaleOnWatchlistWatcher key={r.id} rule={r} />
      ))}
      {partition.token_stats_threshold.map((r) => (
        <TokenStatsWatcher key={r.id} rule={r} />
      ))}
    </>
  );
}

function num(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function fireAlert(
  rule: AlertRule,
  payload: { title: string; body?: string; data?: Record<string, unknown> },
  push: ReturnType<typeof useToast>["push"],
) {
  push({ title: payload.title, body: payload.body, tone: "warn" });
  void fetch("/api/alerts/fire", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ruleId: rule.id,
      type: rule.type,
      title: payload.title,
      body: payload.body,
      payload: payload.data,
      pushTelegram: true,
    }),
  }).catch(() => {});
}

/* -------------------- watchers -------------------- */

function WalletActivityWatcher({ rule }: { rule: AlertRule }) {
  const { push } = useToast();
  const cfg = rule.config as unknown as WalletActivityConfig;
  const stream = useWalletTxStream(cfg.wallet, cfg.chain);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const tx = ev.data as Record<string, unknown>;
    const key = String(tx["txHash"] ?? `${tx["blockUnixTime"] ?? ""}-${Math.random()}`);
    if (seen.current.has(key)) return;
    seen.current.add(key);

    const vol = num(tx["volumeUsd"]);
    if (cfg.minUsd && (vol ?? 0) < cfg.minUsd) return;

    const side = String(tx["side"] ?? "trade");
    const sym = String(
      ((tx["base"] as { symbol?: string } | undefined)?.symbol ??
        (tx["quote"] as { symbol?: string } | undefined)?.symbol) ?? "—",
    );
    fireAlert(
      rule,
      {
        title: `Wallet activity · ${side} ${sym}`,
        body: `${cfg.wallet.slice(0, 6)}…${cfg.wallet.slice(-4)} ${side} ${sym}${vol ? ` $${vol.toLocaleString()}` : ""}`,
        data: tx,
      },
      push,
    );
  }, [stream.data, rule, cfg, push]);

  return null;
}

function NewListingWatcher({ rule }: { rule: AlertRule }) {
  const { push } = useToast();
  const cfg = rule.config as unknown as NewListingConfig;
  const stream = useNewListingStream(cfg.chain, {
    minLiquidity: cfg.minLiquidity,
  });
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const t = ev.data as Record<string, unknown>;
    const key = String(t["address"] ?? `${t["createdTime"] ?? Date.now()}`);
    if (seen.current.has(key)) return;
    seen.current.add(key);

    const sym = String(t["symbol"] ?? t["name"] ?? "");
    if (cfg.keyword) {
      const k = cfg.keyword.toLowerCase();
      const hay = `${sym} ${String(t["name"] ?? "")}`.toLowerCase();
      if (!hay.includes(k)) return;
    }
    fireAlert(
      rule,
      {
        title: `New listing · ${sym || "unknown"} on ${cfg.chain}`,
        body: String(t["address"] ?? ""),
        data: t,
      },
      push,
    );
  }, [stream.data, rule, cfg, push]);

  return null;
}

function NewPairWatcher({ rule }: { rule: AlertRule }) {
  const { push } = useToast();
  const cfg = rule.config as unknown as NewPairConfig;
  const stream = useNewPairStream(cfg.chain, { minLiquidity: cfg.minLiquidity });
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const t = ev.data as Record<string, unknown>;
    const key = String(t["address"] ?? Date.now());
    if (seen.current.has(key)) return;
    seen.current.add(key);
    fireAlert(
      rule,
      {
        title: `New pair on ${cfg.chain}`,
        body: String(t["address"] ?? ""),
        data: t,
      },
      push,
    );
  }, [stream.data, rule, cfg, push]);

  return null;
}

function WhaleOnWatchlistWatcher({ rule }: { rule: AlertRule }) {
  const { push } = useToast();
  const cfg = rule.config as unknown as WhaleOnWatchlistConfig;
  const stream = useLargeTradeStream(cfg.chain, cfg.minUsd);
  const seen = useRef<Set<string>>(new Set());
  const watch = useQuery<{ items: { items: { chain: string; address: string }[] }[] }>({
    queryKey: ["watchlists"],
    queryFn: async () => {
      const r = await fetch("/api/watchlists");
      if (!r.ok) return { items: [] };
      return r.json();
    },
    staleTime: 30_000,
  });

  const watchset = useMemo(() => {
    const set = new Set<string>();
    for (const list of watch.data?.items ?? []) {
      for (const it of list.items ?? []) {
        if (it.chain === cfg.chain && it.address)
          set.add(it.address.toLowerCase());
      }
    }
    return set;
  }, [watch.data, cfg.chain]);

  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const t = ev.data as Record<string, unknown>;
    const tokenAddr = String(
      t["address"] ??
        (t["base"] as { address?: string } | undefined)?.address ??
        "",
    ).toLowerCase();
    if (!tokenAddr || !watchset.has(tokenAddr)) return;
    const key = String(t["txHash"] ?? `${t["blockUnixTime"] ?? Date.now()}`);
    if (seen.current.has(key)) return;
    seen.current.add(key);
    const vol = num(t["volumeUsd"]);
    const sym = String(
      (t["base"] as { symbol?: string } | undefined)?.symbol ?? "",
    );
    fireAlert(
      rule,
      {
        title: `🐋 Whale on watchlist · ${sym}`,
        body: `${String(t["side"] ?? "trade")} ${sym}${vol ? ` $${vol.toLocaleString()}` : ""}`,
        data: t,
      },
      push,
    );
  }, [stream.data, rule, watchset, push]);

  return null;
}

function TokenStatsWatcher({ rule }: { rule: AlertRule }) {
  const { push } = useToast();
  const cfg = rule.config as unknown as TokenStatsThresholdConfig;
  const stream = useTokenStatsStream(cfg.address, cfg.chain);
  const lastFired = useRef<number>(0);

  useEffect(() => {
    const ev = stream.data;
    if (!ev?.data) return;
    const d = ev.data as Record<string, unknown>;
    let value: number | undefined;
    if (cfg.metric === "holder")
      value = num(d["holder"] ?? d["holders"]);
    else if (cfg.metric === "liquidity") value = num(d["liquidity"]);
    else if (cfg.metric === "marketCap")
      value = num(d["mc"] ?? d["marketCap"] ?? d["market_cap"]);
    if (value == null) return;

    const cond = cfg.op === ">=" ? value >= cfg.threshold : value <= cfg.threshold;
    if (!cond) return;
    // de-dupe firings within 60s per rule
    const now = Date.now();
    if (now - lastFired.current < 60_000) return;
    lastFired.current = now;

    fireAlert(
      rule,
      {
        title: `${cfg.metric} ${cfg.op} ${cfg.threshold}`,
        body: `value=${value.toLocaleString()} on ${cfg.address.slice(0, 6)}…`,
        data: d,
      },
      push,
    );
  }, [stream.data, rule, cfg, push]);

  return null;
}
