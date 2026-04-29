# AlphaOS

Onchain market intelligence terminal. Birdeye Data Services frontend.

## Status

**Parts 1-2 complete.** No UI yet. Stack:

- Next.js 15 (App Router) + React 19
- TypeScript strict + `noUncheckedIndexedAccess`
- Tailwind 3 + shadcn/ui scaffolding (components added in later parts)
- Zod for input/output validation
- Drizzle ORM + Neon Postgres
- Upstash Redis (with Postgres `cached_responses` fallback)
- pnpm

**Part 1** — typed Birdeye REST client, ~78 endpoints, 14 categories.
**Part 2** — persistence layer + cached wrapper + credit tracking + health route.

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

## Next

- Part 3: UI — terminal layout, charts, watchlist.
- Part 4: alert engine running off `alert_rules`.
