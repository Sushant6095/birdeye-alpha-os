"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlertRules } from "@/lib/alerts/hooks";
import {
  ALERT_KIND_LABEL,
  type AlertKind,
  type AlertRule,
} from "@/lib/alerts/types";

const KINDS: AlertKind[] = [
  "wallet_activity",
  "new_listing",
  "new_pair",
  "whale_on_watchlist",
  "token_stats_threshold",
];

export default function AlertsPage() {
  const { list, create, update, remove } = useAlertRules();
  const [kind, setKind] = useState<AlertKind>("wallet_activity");
  const [chain, setChain] = useState("solana");
  const [wallet, setWallet] = useState("");
  const [tokenAddr, setTokenAddr] = useState("");
  const [minUsd, setMinUsd] = useState(50_000);
  const [keyword, setKeyword] = useState("");
  const [metric, setMetric] = useState<"holder" | "liquidity" | "marketCap">(
    "holder",
  );
  const [op, setOp] = useState<">=" | "<=">(">=");
  const [threshold, setThreshold] = useState(1000);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let config: Record<string, unknown> = {};
    if (kind === "wallet_activity") {
      if (!wallet) return;
      config = { chain, wallet, minUsd };
    } else if (kind === "new_listing") {
      config = { chain, keyword: keyword || undefined };
    } else if (kind === "new_pair") {
      config = { chain };
    } else if (kind === "whale_on_watchlist") {
      config = { chain, minUsd };
    } else if (kind === "token_stats_threshold") {
      if (!tokenAddr) return;
      config = { chain, address: tokenAddr, metric, op, threshold };
    }
    create.mutate({ type: kind, config });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-4 max-w-3xl">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alert rules</h1>
          <p className="text-sm text-muted-foreground">
            Each rule subscribes the running tab to the matching WS topic and
            fires a toast (and optional Telegram push) when the condition hits.
          </p>
        </div>
        <Link
          href="/settings/alerts/history"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          history →
        </Link>
      </header>

      <form
        onSubmit={submit}
        className="rounded-md border bg-secondary/20 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
      >
        <Field label="Type" full>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AlertKind)}
            className="h-8 rounded-md border border-input bg-transparent px-2"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {ALERT_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Chain">
          <Input
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="h-8"
          />
        </Field>

        {kind === "wallet_activity" && (
          <>
            <Field label="Wallet address">
              <Input
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="h-8 font-mono"
              />
            </Field>
            <Field label="Min USD per tx">
              <Input
                type="number"
                value={minUsd}
                onChange={(e) => setMinUsd(Number(e.target.value) || 0)}
                className="h-8"
              />
            </Field>
          </>
        )}
        {kind === "new_listing" && (
          <Field label="Keyword (sym/name contains)">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-8"
              placeholder="(optional)"
            />
          </Field>
        )}
        {kind === "whale_on_watchlist" && (
          <Field label="Min USD per whale tx">
            <Input
              type="number"
              value={minUsd}
              onChange={(e) => setMinUsd(Number(e.target.value) || 0)}
              className="h-8"
            />
          </Field>
        )}
        {kind === "token_stats_threshold" && (
          <>
            <Field label="Token address">
              <Input
                value={tokenAddr}
                onChange={(e) => setTokenAddr(e.target.value)}
                className="h-8 font-mono"
              />
            </Field>
            <Field label="Metric">
              <select
                value={metric}
                onChange={(e) =>
                  setMetric(e.target.value as typeof metric)
                }
                className="h-8 rounded-md border border-input bg-transparent px-2"
              >
                <option value="holder">holder count</option>
                <option value="liquidity">liquidity</option>
                <option value="marketCap">market cap</option>
              </select>
            </Field>
            <Field label="Op">
              <select
                value={op}
                onChange={(e) => setOp(e.target.value as typeof op)}
                className="h-8 rounded-md border border-input bg-transparent px-2"
              >
                <option value=">=">≥</option>
                <option value="<=">≤</option>
              </select>
            </Field>
            <Field label="Threshold">
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value) || 0)}
                className="h-8"
              />
            </Field>
          </>
        )}

        <div className="sm:col-span-2 flex justify-end">
          <Button
            type="submit"
            className="gap-1"
            disabled={create.isPending}
          >
            <Plus className="h-4 w-4" />
            Add rule
          </Button>
        </div>
      </form>

      {list.isLoading && <Skeleton className="h-40" />}
      {list.error && (
        <p className="text-xs text-red-400">{(list.error as Error).message}</p>
      )}

      <ul className="space-y-2">
        {(list.data?.items ?? []).map((r) => (
          <RuleRow
            key={r.id}
            rule={r}
            onToggle={(enabled) => update.mutate({ id: r.id, enabled })}
            onDelete={() => remove.mutate(r.id)}
          />
        ))}
        {!list.isLoading && (list.data?.items?.length ?? 0) === 0 && (
          <li className="text-sm text-muted-foreground">
            No rules configured.
          </li>
        )}
      </ul>
    </div>
  );
}

function RuleRow({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AlertRule;
  onToggle: (b: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-md border bg-secondary/20 p-3 flex items-center justify-between gap-3 text-xs">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{ALERT_KIND_LABEL[rule.type]}</div>
        <pre className="text-[10px] text-muted-foreground font-mono truncate">
          {JSON.stringify(rule.config)}
        </pre>
      </div>
      <label className="inline-flex items-center gap-1 cursor-pointer text-xs">
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="accent-emerald-400"
        />
        on
      </label>
      <button
        onClick={onDelete}
        className="text-muted-foreground hover:text-red-400"
        aria-label="delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "sm:col-span-2 flex flex-col gap-1" : "flex flex-col gap-1"}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
