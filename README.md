# AlphaOS

Onchain market intelligence terminal. Birdeye Data Services frontend.

## Status

**Part 1 — Birdeye client foundation.** No UI yet. Rock-solid typed REST client over the entire Birdeye endpoint surface (~78 endpoints). Built on:

- Next.js 15 (App Router) + React 19
- TypeScript strict + `noUncheckedIndexedAccess`
- Tailwind 3 + shadcn/ui scaffolding (components added in later parts)
- Zod for input/output validation
- pnpm

## Setup

```bash
pnpm install
cp .env.example .env
# edit .env: set BIRDEYE_API_KEY
pnpm test:client
pnpm typecheck
pnpm dev
```

## Layout

```
app/                    Next.js 15 App Router (placeholder)
components/             shadcn/ui (later)
lib/
  utils.ts              cn() helper
  birdeye/
    client.ts           base fetcher: retry, headers, errors, debug log
    index.ts            barrel — single import surface
    types/              shared types + zod schemas (chain, common)
    rest/               one file per category, one fn per endpoint
      price.ts          price & OHLCV (12)
      stats.ts          token + pair overviews / market data (7)
      tokens.ts         token & market lists (5)
      transactions.ts   trade & tx feeds (16)
      wallet.ts         wallet, networth, PnL (15)
      holder.ts         holders, top traders (5)
      balance.ts        balances & transfers (7)
      blockchain.ts     network metadata (2)
      creation.ts       token creation, trending (2)
      meme.ts           meme tokens (2)
      security.ts       token security (1)
      smartmoney.ts     smart-money wallets (1)
      history.ts        all-time + history (2)
      search.ts         search & utils (2)
scripts/
  test-client.ts        end-to-end smoke against 5 endpoints
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

## Next

- Part 2: Postgres + Redis caching layer in front of the client.
- Part 3: UI — terminal layout, charts, watchlist.
