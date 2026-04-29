import "server-only";
import { getPairOverviewSingle } from "@/lib/birdeye/cached";

export interface PairTokenInfo {
  address?: string;
  symbol?: string;
  name?: string;
  logoURI?: string;
  decimals?: number;
}

export interface PairOverview {
  address?: string;
  source?: string;
  liquidity?: number;
  price?: number;
  volume24h?: number;
  txCount24h?: number;
  base?: PairTokenInfo;
  quote?: PairTokenInfo;
  [k: string]: unknown;
}

export interface PairBundle {
  chain: string;
  address: string;
  overview: PairOverview | null;
}

export async function loadPairBundle(
  chain: string,
  address: string,
): Promise<PairBundle> {
  let overview: PairOverview | null = null;
  try {
    overview = (await getPairOverviewSingle(
      { address },
      chain as never,
    )) as PairOverview;
  } catch {
    overview = null;
  }
  return { chain, address, overview };
}
