/**
 * Address-format validators per chain. Used to short-circuit obviously wrong
 * URLs (e.g. /token/solana/0xabc…) before they fan out to 8 doomed Birdeye
 * calls and burn the rate limit.
 */

const HEX40 = /^0x[0-9a-fA-F]{40}$/;
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

/**
 * Validators are intentionally PERMISSIVE: we only block when the URL is
 * unambiguously wrong (e.g. an EVM 0x address with a Solana chain in the
 * URL). For anything else we let Birdeye decide — its error message is
 * surfaced cleanly via the friendly toast envelope.
 *
 * Specifically: we do NOT reject Sui type-tag addresses (`0xHEX::mod::TYPE`),
 * pump.fun short addresses, or LP/SPL pools that don't match strict regexes.
 */
export function checkAddress(chain: string, address: string): AddressCheck {
  const c = chain.toLowerCase();
  const a = address.trim();
  if (!a) return { ok: false, expected: "unknown", reason: "Empty address." };

  if (c === "solana") {
    // Block only the unambiguous EVM-on-solana case.
    if (HEX40.test(a)) {
      return {
        ok: false,
        expected: "solana-base58",
        suggestedChain: "ethereum",
        reason:
          "This is an EVM address (0x… 40 hex). Solana uses base58 (≈44 chars).",
      };
    }
    return { ok: true, expected: "solana-base58" };
  }

  if (EVM_CHAINS.has(c)) {
    if (HEX40.test(a)) return { ok: true, expected: "evm-hex" };
    // Pure base58 with no `0x` prefix is almost certainly Solana.
    if (SOL_BASE58.test(a) && !a.startsWith("0x")) {
      return {
        ok: false,
        expected: "evm-hex",
        suggestedChain: "solana",
        reason: "This looks like a Solana base58 address.",
      };
    }
    // Anything else (pool IDs, LP tokens, longer hex) — let Birdeye decide.
    return { ok: true, expected: "evm-hex" };
  }

  // Sui (and any other chain) — accept and let Birdeye validate.
  // Sui token type tags look like `0xHEX::module::TYPE` and would fail a
  // strict 64-hex regex; they're valid identifiers we shouldn't block.
  return { ok: true, expected: c === "sui" ? "sui-hex" : "unknown" };
}

/** Same shape, used by `/wallet/[chain]/[address]` — same rules apply. */
export function checkWalletAddress(chain: string, address: string): AddressCheck {
  return checkAddress(chain, address);
}
