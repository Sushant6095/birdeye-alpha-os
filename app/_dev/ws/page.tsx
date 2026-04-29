"use client";

import { useState } from "react";
import {
  usePriceStream,
  useTradeStream,
  useNewListingStream,
  useNewPairStream,
  useLargeTradeStream,
  useWalletTxStream,
  useTokenStatsStream,
  useMemeStatsStream,
  useBaseQuotePriceStream,
  type StreamHandle,
} from "@/lib/ws/hooks";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type Topic =
  | "price"
  | "txs"
  | "base_quote_price"
  | "new_listing"
  | "new_pair"
  | "large_trade"
  | "wallet_txs"
  | "token_stats"
  | "meme_stats";

const TOPICS: Topic[] = [
  "price",
  "txs",
  "base_quote_price",
  "new_listing",
  "new_pair",
  "large_trade",
  "wallet_txs",
  "token_stats",
  "meme_stats",
];

export default function DevWsPage() {
  const [topic, setTopic] = useState<Topic>("price");
  const [chain, setChain] = useState("solana");
  const [address, setAddress] = useState(SOL);
  const [base, setBase] = useState(SOL);
  const [quote, setQuote] = useState(USDC);
  const [minUsd, setMinUsd] = useState(10_000);
  const [interval, setInterval] = useState("1m");

  // Call every hook unconditionally; gate with `enabled` to avoid extra subs.
  const priceS = usePriceStream(address, chain, interval, {
    enabled: topic === "price",
  });
  const tradeS = useTradeStream(address, chain, { enabled: topic === "txs" });
  const bqS = useBaseQuotePriceStream(base, quote, chain, interval, {
    enabled: topic === "base_quote_price",
  });
  const newListingS = useNewListingStream(chain, {
    enabled: topic === "new_listing",
  });
  const newPairS = useNewPairStream(chain, { enabled: topic === "new_pair" });
  const largeTradeS = useLargeTradeStream(chain, minUsd, {
    enabled: topic === "large_trade",
  });
  const walletS = useWalletTxStream(address, chain, {
    enabled: topic === "wallet_txs",
  });
  const tokenStatsS = useTokenStatsStream(address, chain, {
    enabled: topic === "token_stats",
  });
  const memeStatsS = useMemeStatsStream(chain, {
    enabled: topic === "meme_stats",
  });

  const stream: StreamHandle<unknown> = (() => {
    switch (topic) {
      case "price":
        return priceS;
      case "txs":
        return tradeS;
      case "base_quote_price":
        return bqS;
      case "new_listing":
        return newListingS;
      case "new_pair":
        return newPairS;
      case "large_trade":
        return largeTradeS;
      case "wallet_txs":
        return walletS;
      case "token_stats":
        return tokenStatsS;
      case "meme_stats":
        return memeStatsS;
    }
  })();

  const needsAddress = ["price", "txs", "wallet_txs", "token_stats"].includes(
    topic,
  );
  const needsPair = topic === "base_quote_price";
  const needsInterval = ["price", "base_quote_price"].includes(topic);
  const needsMinUsd = topic === "large_trade";

  return (
    <main className="container mx-auto px-6 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">WS Dev</h1>
        <p className="text-sm text-muted-foreground">
          Subscribe to any of the 9 Birdeye WebSocket streams via the sidecar
          SSE bridge.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Topic">
          <select
            className="border rounded px-2 py-1 bg-background"
            value={topic}
            onChange={(e) => setTopic(e.target.value as Topic)}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Chain">
          <input
            className="border rounded px-2 py-1 bg-background"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
          />
        </Field>
        {needsAddress && (
          <Field label="Address">
            <input
              className="border rounded px-2 py-1 bg-background w-full"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        )}
        {needsPair && (
          <>
            <Field label="Base">
              <input
                className="border rounded px-2 py-1 bg-background w-full"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              />
            </Field>
            <Field label="Quote">
              <input
                className="border rounded px-2 py-1 bg-background w-full"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
            </Field>
          </>
        )}
        {needsInterval && (
          <Field label="Interval">
            <input
              className="border rounded px-2 py-1 bg-background"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            />
          </Field>
        )}
        {needsMinUsd && (
          <Field label="Min USD">
            <input
              type="number"
              className="border rounded px-2 py-1 bg-background"
              value={minUsd}
              onChange={(e) => setMinUsd(Number(e.target.value))}
            />
          </Field>
        )}
      </section>

      <section className="flex items-center gap-4">
        <span className="text-sm">
          Status:{" "}
          <span
            className={
              stream.status === "open"
                ? "text-green-400"
                : stream.status === "error"
                  ? "text-red-400"
                  : "text-muted-foreground"
            }
          >
            {stream.status}
          </span>
        </span>
        <button
          onClick={stream.reconnect}
          className="text-sm border rounded px-3 py-1 hover:bg-secondary"
        >
          Reconnect
        </button>
        {stream.error && (
          <span className="text-sm text-red-400">err: {stream.error}</span>
        )}
        <span className="text-sm text-muted-foreground">
          events: {stream.buffer.length}
        </span>
      </section>

      <section className="border rounded-md p-3 bg-secondary/30 text-xs font-mono max-h-[60vh] overflow-auto">
        {stream.buffer.length === 0 ? (
          <p className="text-muted-foreground">Waiting for events…</p>
        ) : (
          stream.buffer.map((e, i) => (
            <pre key={i} className="border-b border-border/40 py-1">
              {JSON.stringify(e, null, 2)}
            </pre>
          ))
        )}
      </section>
    </main>
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
