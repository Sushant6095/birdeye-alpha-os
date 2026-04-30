/**
 * Address-format validators per chain. Used to short-circuit obviously wrong
 * URLs (e.g. /token/solana/0xabc…) before they fan out to 8 doomed Birdeye
 * calls and burn the rate limit.
 */

const HEX40 = /^0x[0-9a-fA-F]{40}$/;
const HEX_SUI = /^0x[0-9a-fA-F]{64}$/;
const SOL_BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const EVM_CHAINS = new Set([
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "bsc",
  "avalanche",
  "zksync",
  "berachain",
  "ronin",
  "linea",
  "sei",
  "monad",
  "abstract",
  "hyperliquid",
]);

export interface AddressCheck {
  ok: boolean;
  /** Format expected for this chain. */
  expected: "evm-hex" | "solana-base58" | "sui-hex" | "unknown";
  /** Best-guess chain hint when mismatch — e.g. URL says solana but address looks EVM. */
  suggestedChain?: string;
  reason?: string;
}

export function checkAddress(chain: string, address: string): AddressCheck {
  const c = chain.toLowerCase();
  const a = address.trim();

  if (c === "solana") {
    if (SOL_BASE58.test(a)) return { ok: true, expected: "solana-base58" };
    if (HEX40.test(a)) {
      return {
        ok: false,
        expected: "solana-base58",
        suggestedChain: "ethereum",
        reason: "This is an EVM address (0x… 40 hex). Solana uses base58 (≈44 chars).",
      };
    }
    return {
      ok: false,
      expected: "solana-base58",
      reason: "Not a valid Solana base58 address.",
    };
  }

  if (c === "sui") {
    if (HEX_SUI.test(a)) return { ok: true, expected: "sui-hex" };
    if (HEX40.test(a)) {
      return {
        ok: false,
        expected: "sui-hex",
        suggestedChain: "ethereum",
        reason: "This is an EVM address (40 hex). Sui addresses are 64 hex.",
      };
    }
    if (SOL_BASE58.test(a)) {
      return {
        ok: false,
        expected: "sui-hex",
        suggestedChain: "solana",
        reason: "This looks like a Solana base58 address.",
      };
    }
    return { ok: false, expected: "sui-hex", reason: "Not a valid Sui hex address." };
  }

  if (EVM_CHAINS.has(c)) {
    if (HEX40.test(a)) return { ok: true, expected: "evm-hex" };
    if (SOL_BASE58.test(a)) {
      return {
        ok: false,
        expected: "evm-hex",
        suggestedChain: "solana",
        reason: "This looks like a Solana base58 address.",
      };
    }
    return {
      ok: false,
      expected: "evm-hex",
      reason: "EVM addresses are 0x followed by 40 hex characters.",
    };
  }

  return { ok: true, expected: "unknown" };
}

/** Same shape, used by `/wallet/[chain]/[address]` — same rules apply. */
export function checkWalletAddress(chain: string, address: string): AddressCheck {
  return checkAddress(chain, address);
}
