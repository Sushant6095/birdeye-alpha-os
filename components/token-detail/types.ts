/** Plain shapes used across the token detail panels. Keep loose — Birdeye
 *  payloads vary slightly across chains and we passthrough unknown fields. */

export interface TokenOverview {
  address?: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
  price?: number;
  priceChange24hPercent?: number;
  liquidity?: number;
  mc?: number;
  marketCap?: number;
  realMc?: number;
  supply?: number;
  totalSupply?: number;
  circulatingSupply?: number;
  holder?: number;
  v24hUSD?: number;
  buys24h?: number;
  sells24h?: number;
  extensions?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface TokenSecurity {
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  isToken2022?: boolean;
  transferFeeEnable?: boolean | null;
  ownerAddress?: string | null;
  ownerPercentage?: number | null;
  top10HolderPercent?: number;
  top10HolderBalance?: number;
  isTrueToken?: boolean | null;
  freezeable?: boolean | null;
  creatorAddress?: string;
  creationTime?: number;
  totalSupply?: number | string;
  [k: string]: unknown;
}

export interface TokenMarketData {
  address?: string;
  price?: number;
  liquidity?: number;
  supply?: number;
  marketcap?: number;
  circulating_supply?: number;
  circulating_marketcap?: number;
  fdv?: number;
  [k: string]: unknown;
}

export interface TokenTradeData {
  price?: number;
  buy_24h?: number;
  sell_24h?: number;
  trade_24h?: number;
  buy_volume_24h?: number;
  sell_volume_24h?: number;
  volume_24h_usd?: number;
  unique_wallet_24h?: number;
  [k: string]: unknown;
}

export interface AllTimeTrades {
  total_trades?: number;
  total_volume_usd?: number;
  [k: string]: unknown;
}

export interface CreationInfo {
  txHash?: string;
  slot?: number;
  tokenAddress?: string;
  decimals?: number;
  owner?: string;
  blockUnixTime?: number;
  blockHumanTime?: string;
  [k: string]: unknown;
}

export interface TokenMeta {
  symbol?: string;
  name?: string;
  decimals?: number;
  logo_uri?: string;
  extensions?: Record<string, unknown> & {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    coingeckoId?: string;
  };
  [k: string]: unknown;
}

export interface InitialBundle {
  chain: string;
  address: string;
  overview: TokenOverview | null;
  security: TokenSecurity | null;
  marketData: TokenMarketData | null;
  tradeData: TokenTradeData | null;
  allTime: AllTimeTrades | null;
  creation: CreationInfo | null;
  meta: TokenMeta | null;
  isTrending: boolean;
}
