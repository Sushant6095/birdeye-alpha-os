# AlphaOS

Onchain market intelligence terminal. Birdeye Data Services frontend.

## Status

**Parts 1-4 complete.** Discover feed live. Stack:

- Next.js 15 (App Router) + React 19
- TypeScript strict + `noUncheckedIndexedAccess`
- Tailwind 3 + shadcn/ui scaffolding (components added in later parts)
- Zod for input/output validation
- Drizzle ORM + Neon Postgres
- Upstash Redis (with Postgres `cached_responses` fallback)
- pnpm

**Part 1** — typed Birdeye REST client, ~78 endpoints, 14 categories.
**Part 2** — persistence layer + cached wrapper + credit tracking + health route.
**Part 3** — WS sidecar (Hono + ws) → SSE bridge for all 9 Birdeye WebSocket streams + React hooks.
**Part 4** — app shell (sidebar / topbar / chain selector / credit gauge / Cmd+K search) + `/discover` feed with 7 chip-tabs + infinite scroll.

## Setup

```bash
pnpm install
cp .env.example .env
# fill in: BIRDEYE_API_KEY, DATABASE_URL (Neon), UPSTASH_REDIS_REST_URL/_TOKEN
pnpm db:generate     # generate migrations from lib/db/schema/
pnpm db:migrate      # apply to your Neon DB
pnpm test:client     # 5-endpoint smoke test
pnpm typecheck
pnpm dev             # then GET http://localhost:3000/api/health
```

## Layout

```
app/
  api/health/route.ts   GET / DB+Redis+Birdeye liveness
components/             shadcn/ui (later)
drizzle/                generated migrations (committed)
lib/
  utils.ts              cn() helper
  db/
    index.ts            Drizzle client (lazy Neon HTTP)
    schema/             users, watchlists, alerts, ai, cache, credits
  cache/
    redis.ts            Upstash REST client + Postgres fallback + ping
  birdeye/
    client.ts           base fetcher + credit observer hook
    index.ts            raw barrel — direct API surface
    cached.ts           cache wrapper, same signatures, category TTLs
    credits.ts          observer subscriber → credit_usage_log
    context.ts          AsyncLocalStorage for per-call userId
    types/              shared types + zod schemas (chain, common)
    rest/               one file per category, one fn per endpoint
scripts/
  test-client.ts        end-to-end smoke against 5 endpoints
  db-migrate.ts         drizzle migrate runner
services/
  ws-sidecar/           standalone Node service — Birdeye WS → SSE
    src/
      index.ts          Hono server + SSE /sse/:topic
      birdeye-ws.ts     per-chain WS manager (ref-counted, reconnects)
      topics.ts         9 topic kinds + subscribe message builders
      parse-topic.ts    query → TopicParams
      log.ts            level-gated structured logger
    Dockerfile          fly.io-ready container
    fly.toml            fly app config
```

## Client features

- `BIRDEYE_API_KEY` from env, optional `BIRDEYE_BASE_URL` override.
- `X-API-KEY` + `x-chain` headers on every request.
- `birdeyeGet<T>(path, opts)` and `birdeyePost<T>(path, opts)` with full Zod input/output validation.
- 3-attempt exponential backoff with jitter on 408/425/429/5xx and network errors.
- Throws `BirdeyeError` with `status`, `endpoint`, `chain`, `body`, `cause`.
- Per-call latency + `x-credits-consumed` / `x-credits-left` log to stderr when `BIRDEYE_DEBUG=1`.
- Supported chains validated by `BirdeyeChainSchema` (solana, ethereum, base, …).

## Coverage (78 endpoints)

### Price & OHLCV (12 ✅)
- ✅ `GET /defi/price` — `getPrice`
- ✅ `GET /defi/multi_price` — `getMultiPrice`
- ✅ `POST /defi/multi_price` — `postMultiPrice`
- ✅ `GET /defi/historical_price_unix` — `getHistoricalPriceUnix`
- ✅ `GET /defi/history_price` — `getHistoryPrice`
- ✅ `GET /defi/price_volume/single` — `getPriceVolumeSingle`
- ✅ `POST /defi/price_volume/multi` — `postPriceVolumeMulti`
- ✅ `GET /defi/ohlcv` — `getOhlcv`
- ✅ `GET /defi/ohlcv/pair` — `getOhlcvPair`
- ✅ `GET /defi/ohlcv/base_quote` — `getOhlcvBaseQuote`
- ✅ `GET /defi/v3/ohlcv` — `getOhlcvV3`
- ✅ `GET /defi/v3/ohlcv/pair` — `getOhlcvPairV3`

### Stats (7 ✅)
- ✅ `GET /defi/token_overview` — `getTokenOverview`
- ✅ `GET /defi/v3/token/market-data` — `getTokenMarketData`
- ✅ `GET /defi/v3/token/trade-data/single` — `getTokenTradeDataSingle`
- ✅ `POST /defi/v3/token/trade-data/multiple` — `postTokenTradeDataMultiple`
- ✅ `GET /defi/v3/pair/overview/single` — `getPairOverviewSingle`
- ✅ `POST /defi/v3/pair/overview/multiple` — `postPairOverviewMultiple`
- ✅ `GET /defi/v3/token/meta-data/single` — `getTokenMetaDataSingle`

### Token / Market List (5 ✅)
- ✅ `GET /defi/tokenlist` — `getTokenList`
- ✅ `GET /defi/v3/token/list` — `getTokenListV3`
- ✅ `GET /defi/v3/token/list/scroll` — `getTokenListScroll`
- ✅ `GET /defi/v2/markets` — `getMarkets`
- ✅ `GET /defi/v3/pair/list` — `getPairList`

### Transactions (16 ✅)
- ✅ `GET /defi/txs/token` — `getTxsToken`
- ✅ `GET /defi/txs/pair` — `getTxsPair`
- ✅ `GET /defi/txs/token/seek_by_time` — `getTxsTokenSeekByTime`
- ✅ `GET /defi/txs/pair/seek_by_time` — `getTxsPairSeekByTime`
- ✅ `GET /defi/v3/token/txs` — `getTokenTxsV3`
- ✅ `GET /defi/v3/pair/txs` — `getPairTxsV3`
- ✅ `GET /defi/v3/token/txs/recent` — `getTokenTxsRecent`
- ✅ `GET /defi/v3/pair/txs/recent` — `getPairTxsRecent`
- ✅ `GET /defi/v3/all-time/trades/single` — `getAllTimeTradesSingle`
- ✅ `POST /defi/v3/all-time/trades/multiple` — `postAllTimeTradesMultiple`
- ✅ `GET /trader/txs/seek_by_time` — `getTraderTxsSeekByTime`
- ✅ `GET /trader/gainers-losers` — `getGainersLosers`
- ✅ `GET /defi/v3/txs/recent` — `getTxsRecent`
- ✅ `GET /defi/v3/large-trades` — `getLargeTrades`
- ✅ `GET /defi/v3/token/large-trades` — `getTokenLargeTrades`
- ✅ `GET /defi/v3/pair/large-trades` — `getPairLargeTrades`

### Wallet, Networth & PnL (15 ✅)
- ✅ `GET /v1/wallet/list_supported_chain` — `listSupportedChain`
- ✅ `GET /v1/wallet/multichain_token_list` — `getMultichainTokenList`
- ✅ `GET /v1/wallet/token_list` — `getWalletTokenList`
- ✅ `GET /v1/wallet/token_balance` — `getWalletTokenBalance`
- ✅ `GET /v1/wallet/tx_list` — `getWalletTxList`
- ✅ `GET /v1/wallet/multichain_tx_list` — `getMultichainTxList`
- ✅ `POST /v1/wallet/simulate` — `postWalletSimulate`
- ✅ `GET /v1/wallet/networth` — `getWalletNetworth`
- ✅ `GET /v1/wallet/multichain_networth` — `getMultichainNetworth`
- ✅ `GET /trader/wallet/pnl-summary` — `getWalletPnLSummary`
- ✅ `GET /trader/wallet/pnl-detail` — `getWalletPnLDetail`
- ✅ `GET /trader/wallet/positions` — `getWalletPositions`
- ✅ `GET /trader/wallet/realized-pnl` — `getWalletRealizedPnL`
- ✅ `GET /trader/wallet/unrealized-pnl` — `getWalletUnrealizedPnL`
- ✅ `GET /trader/wallet/holdings` — `getWalletHoldings`

### Holder (5 ✅)
- ✅ `GET /defi/v3/token/holder` — `getTokenHolder`
- ✅ `GET /defi/v3/token/top_traders` — `getTopTraders`
- ✅ `GET /defi/v3/token/top_traders/list` — `getTopTradersList`
- ✅ `GET /defi/v3/token/holder/distribution` — `getHolderDistribution`
- ✅ `GET /defi/v3/token/holder/active` — `getActiveHolders`

### Balance & Transfer (7 ✅)
- ✅ `GET /defi/v3/balance/token` — `getBalanceToken`
- ✅ `GET /defi/v3/balance/wallet` — `getBalanceWallet`
- ✅ `GET /defi/v3/balance/multi` — `getBalanceMulti`
- ✅ `GET /defi/v3/transfers/token` — `getTransfersToken`
- ✅ `GET /defi/v3/transfers/wallet` — `getTransfersWallet`
- ✅ `GET /defi/v3/transfers/recent` — `getTransfersRecent`
- ✅ `GET /defi/v3/transfers/multi` — `getTransfersMulti`

### Blockchain (2 ✅)
- ✅ `GET /defi/v3/networks` — `getNetworks`
- ✅ `GET /defi/v3/blockchain/stats` — `getBlockchainStats`

### Creation & Trending (2 ✅)
- ✅ `GET /defi/token_creation_info` — `getTokenCreationInfo`
- ✅ `GET /defi/token_trending` — `getTokenTrending`

### Meme (2 ✅)
- ✅ `GET /defi/v3/meme/list` — `getMemeList`
- ✅ `GET /defi/v3/meme/trending` — `getMemeTrending`

### Security (1 ✅)
- ✅ `GET /defi/token_security` — `getTokenSecurity`

### Smart Money (1 ✅)
- ✅ `GET /trader/smart-money/list` — `getSmartMoneyList`

### All-time & History (2 ✅)
- ✅ `GET /defi/v3/all-time/holders/single` — `getAllTimeHoldersSingle`
- ✅ `GET /defi/v3/history/price` — `getHistoryPriceV3`

### Search & Utils (2 ✅)
- ✅ `GET /defi/v3/search` — `search`
- ✅ `GET /defi/networks` — `getLegacyNetworks`

**Total: 78 / 78 ✅**

> Output schemas use `passthrough()` to keep the client forward-compatible with new fields Birdeye adds. Inputs are strictly validated.

## Smoke test

```bash
pnpm test:client
```

Hits price, token overview, holder list, wallet net worth, and search against SOL on Solana. Emits per-call latency + credit cost.

## Caching (Part 2)

Import from `@/lib/birdeye/cached` instead of `@/lib/birdeye` to use the cached layer — every endpoint name and signature is identical, so callers don't change.

```ts
import { getPrice } from "@/lib/birdeye/cached";
const sol = await getPrice({ address: SOL_MINT }, "solana");
```

Cache key: `birdeye:{category}:{endpoint}:{sha1(input).slice(0,16)}:{chain}`.

Reads check Upstash Redis first, fall back to Postgres `cached_responses`, and only then call Birdeye. Live calls fire the credit observer in [lib/birdeye/credits.ts](lib/birdeye/credits.ts), which writes one row to `credit_usage_log` per network call (cache hits log with `cache_hit=1`, `credits=0`). Use `getCreditsUsedToday(userId?)` for budget displays.

| Category    | TTL      | Endpoints |
| ----------- | -------- | --------- |
| `price`     | 3 s      | `/defi/price`, `/defi/multi_price`, `/defi/price_volume/*` |
| `ohlcv`     | 5 s ≤30m / 60 s ≥1h | `/defi/ohlcv*`, `/defi/history_price`, `/defi/v3/history/price` |
| `trending`  | 30 s     | trending lists, gainers/losers, large trades, meme, smart money |
| `txs`       | 30 s     | `/defi/txs/*`, `/defi/v3/*/txs*`, wallet tx feeds |
| `transfers` | 60 s     | `/defi/v3/transfers/*` |
| `networth`  | 60 s     | wallet portfolio, balances, networth |
| `pnl`       | 2 min    | `/trader/wallet/pnl-*`, positions, realized/unrealized, top traders |
| `holder`    | 10 min   | holder list, distribution, active holders |
| `list`      | 60 s     | token & pair list endpoints |
| `search`    | 5 min    | `/defi/v3/search` |
| `security`  | 1 h      | `/defi/token_security` |
| `metadata`  | 24 h     | overview, market-data, meta-data, creation info, networks, all-time stats |

To attribute credits to a user, run the call inside `runWithBirdeyeContext`:

```ts
import { runWithBirdeyeContext, getPrice } from "@/lib/birdeye/cached";
await runWithBirdeyeContext({ userId: req.user.id }, () =>
  getPrice({ address }, "solana"),
);
```

## Health check

```
GET /api/health
```

Returns 200 when DB + cache + Birdeye are all reachable, 503 otherwise. Per-check latency and detail string for fast triage.

## Realtime (Part 3)

A standalone Node sidecar at [services/ws-sidecar/](services/ws-sidecar/) maintains persistent WebSocket connections to Birdeye and exposes them to the browser as SSE. Running it as a separate process means upstream WS reconnects can never crash the Next.js app.

### Run

```bash
# terminal 1
BIRDEYE_API_KEY=xxx pnpm --filter ws-sidecar dev      # tsx watch on :4001

# terminal 2
NEXT_PUBLIC_WS_SIDECAR_URL=http://localhost:4001 pnpm dev
# open http://localhost:3000/_dev/ws
```

### SSE protocol

```
GET /sse/:topic?<params>&chain=solana
```

The sidecar opens (or reuses) one upstream Birdeye subscription per `(chain, topic-key)`, and reference-counts SSE clients on top of it. 100 browsers tailing `/sse/price?address=…&chain=solana` ⇒ **1** upstream Birdeye subscription. When the last browser disconnects, the sidecar sends `UNSUBSCRIBE_*` and frees the slot.

| Topic              | Subscribe type             | Required params                | Hook                       |
| ------------------ | -------------------------- | ------------------------------ | -------------------------- |
| `price`            | `SUBSCRIBE_PRICE`          | `address` (`interval?`)        | `usePriceStream`           |
| `txs`              | `SUBSCRIBE_TXS`            | `address`                      | `useTradeStream`           |
| `base_quote_price` | `SUBSCRIBE_BASE_QUOTE_PRICE` | `base`, `quote`              | `useBaseQuotePriceStream`  |
| `new_listing`      | `SUBSCRIBE_TOKEN_NEW_LISTING` | —                           | `useNewListingStream`      |
| `new_pair`         | `SUBSCRIBE_NEW_PAIR`       | —                              | `useNewPairStream`         |
| `large_trade`      | `SUBSCRIBE_LARGE_TRADE_TXS` | `minUsd?`                     | `useLargeTradeStream`      |
| `wallet_txs`       | `SUBSCRIBE_WALLET_TXS`     | `address`                      | `useWalletTxStream`        |
| `token_stats`      | `SUBSCRIBE_TOKEN_STATS`    | `address`                      | `useTokenStatsStream`      |
| `meme_stats`       | `SUBSCRIBE_MEME_STATS`     | —                              | `useMemeStatsStream`       |

Each hook returns `{ data, buffer, status, error, reconnect }`.

### Reliability

- **Reconnect**: exponential backoff (500 ms → 30 s + jitter). On reconnect, all live subscriptions are re-sent.
- **Heartbeat**: `ws.ping()` every 30 s upstream; SSE comment ping every 25 s downstream.
- **Late joiner replay**: a topic's last event is replayed to the next subscriber, so opening the page after the first tick shows the current value immediately.
- **Cleanup**: when chain has zero subscriptions, the upstream WS is closed.

### Deploy (Fly)

```bash
cd services/ws-sidecar
fly launch --no-deploy --copy-config
fly secrets set BIRDEYE_API_KEY=xxx
fly deploy
```

## Dev UI

`/_dev/ws` — pick any of the 9 topics, fill in params, watch events scroll. Useful for verifying end-to-end after touching anything WS-related.

> Folder is named `app/%5Fdev/ws/` so Next.js doesn't treat it as a private folder. The URL is `/_dev/ws`.

## Discover (Part 4)

`/discover` is the first user-facing surface. Chip filters across the top:

| Chip               | Source                                     | Behavior                |
| ------------------ | ------------------------------------------ | ----------------------- |
| Trending           | `Token - Trending List`                    | offset+limit pagination |
| New Listings       | `Token - List V3` sort by recent listing   | first page              |
| Top Gainers        | `Token - List V3 Scroll` 24h % desc        | infinite scroll         |
| Top Losers         | `Token - List V3 Scroll` 24h % asc         | infinite scroll         |
| Smart Money Buys   | `Smart Money - Token List`                 | first page              |
| Memes              | `Meme Token - List`                        | first page              |
| By DEX             | `Token - All Market List` grouped by `source` | grouped section list |

Each `TokenCard` shows logo, symbol, price, 24h % (green/red), SVG sparkline, 24h volume, market cap, and a 🧠 SM badge if smart money holds it. Clicks deep-link to `/token/[chain]/[address]` (target route lands in Part 5).

### Topbar
- Cmd/Ctrl+K → global search palette → `/api/search` → `Search - Token, market Data` (cached). Hits dispatch by type: token, pair, wallet.
- Chain selector → `/api/chains` (`Supported Networks`) with localStorage persistence and a hardcoded fallback list if the upstream call fails.
- Credit gauge → `/api/credits` reads `getCreditsUsedToday()` + last-seen `creditsLeft` from `credit_usage_log` (Part 2). Tone shifts amber > 70 %, red > 90 %.
- Bot FAB lower right is a placeholder — wires up in Part 9.

Data fetching: TanStack Query (`@tanstack/react-query`) with 30 s `staleTime`. Server route handlers (`app/api/discover/*`) call the Part 2 cached client, so identical requests within TTL serve from Redis/Postgres rather than burning credits.

## Next

- Part 5: token / pair / wallet detail pages.
- Part 6: alert engine running off `alert_rules`.
