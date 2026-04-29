export type AlertKind =
  | "wallet_activity"
  | "new_listing"
  | "new_pair"
  | "whale_on_watchlist"
  | "token_stats_threshold";

export interface WalletActivityConfig {
  chain: string;
  wallet: string;
  /** minimum USD per individual tx to fire on (default: 0). */
  minUsd?: number;
}

export interface NewListingConfig {
  chain: string;
  /** substring filter on symbol or name. */
  keyword?: string;
  minLiquidity?: number;
}

export interface NewPairConfig {
  chain: string;
  minLiquidity?: number;
}

export interface WhaleOnWatchlistConfig {
  chain: string;
  minUsd: number;
}

export interface TokenStatsThresholdConfig {
  chain: string;
  address: string;
  metric: "holder" | "liquidity" | "marketCap";
  /** comparator. */
  op: ">=" | "<=";
  threshold: number;
}

export type AlertConfig =
  | WalletActivityConfig
  | NewListingConfig
  | NewPairConfig
  | WhaleOnWatchlistConfig
  | TokenStatsThresholdConfig;

export interface AlertRule {
  id: string;
  type: AlertKind;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}

export const ALERT_KIND_LABEL: Record<AlertKind, string> = {
  wallet_activity: "Wallet activity",
  new_listing: "New token listing",
  new_pair: "New pair",
  whale_on_watchlist: "Whale on watchlist token",
  token_stats_threshold: "Token stats threshold",
};
