/**
 * Wallet verdict classifier.
 *
 * Pure function over a small bag of behavioural metrics that we derive from
 * Birdeye's wallet endpoints. Output is one of seven labels plus a list of
 * `reasons` strings — those explain *why* the label was assigned and should
 * be surfaced in the UI for transparency.
 *
 * ## Rules (evaluated in order — first match wins)
 *
 * 1. **Inactive** — `daysSinceLastTx > 30` OR `tradeCount === 0`.
 *    Nothing to say about a dormant wallet.
 *
 * 2. **Sniper Bot** — `avgHoldingHours < 1` AND `tradeCount > 50`.
 *    Many trades, average holding time under an hour ⇒ algorithmic flipper.
 *
 * 3. **Exit Liquidity** — `winRatePct < 30` AND `realizedPnlUsd < -1_000`
 *    AND `tradeCount > 20`. Bag-holder pattern: lots of losing trades.
 *
 * 4. **High-Risk Degen** — `uniqueTokens > 100` AND `winRatePct < 40`.
 *    Spray-and-pray on hundreds of small caps, low hit rate.
 *
 * 5. **Hodler** — `avgHoldingHours > 720` (≥30 d) AND `tradeCount < 10`.
 *    Or as a fallback when activity is too sparse to classify.
 *
 * 6. **Alpha Trader** — `winRatePct ≥ 60` AND `realizedPnlUsd > 50_000`
 *    AND `tradeCount > 30`. The top tier.
 *
 * 7. **Consistent Earner** — `winRatePct ≥ 50` AND `realizedPnlUsd > 0`
 *    AND `tradeCount > 20`. Profitable but not exceptional.
 *
 * 8. **Fallback** — `realizedPnlUsd > 0 → Consistent Earner`,
 *    else `High-Risk Degen`.
 *
 * Determinism: identical input ⇒ identical output. No randomness, no I/O.
 */

export type WalletVerdictLabel =
  | "Alpha Trader"
  | "Consistent Earner"
  | "Sniper Bot"
  | "High-Risk Degen"
  | "Exit Liquidity"
  | "Hodler"
  | "Inactive";

export interface WalletVerdictInputs {
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  totalVolumeUsd: number;
  tradeCount: number;
  /** 0 – 100 */
  winRatePct: number;
  avgHoldingHours: number;
  uniqueTokens: number;
  daysSinceFirstTx: number;
  daysSinceLastTx: number;
}

export interface WalletVerdict {
  label: WalletVerdictLabel;
  /** 0 – 1, rough certainty. */
  confidence: number;
  reasons: string[];
}

const DEFAULTS: WalletVerdictInputs = {
  realizedPnlUsd: 0,
  unrealizedPnlUsd: 0,
  totalVolumeUsd: 0,
  tradeCount: 0,
  winRatePct: 0,
  avgHoldingHours: 0,
  uniqueTokens: 0,
  daysSinceFirstTx: 0,
  daysSinceLastTx: 0,
};

/** Classify a wallet from its behavioural metrics. */
export function classifyWallet(
  raw: Partial<WalletVerdictInputs>,
): WalletVerdict {
  const i: WalletVerdictInputs = { ...DEFAULTS, ...raw };
  const reasons: string[] = [];

  // 1. Inactive
  if (i.tradeCount === 0) {
    return verdict("Inactive", 0.95, ["zero trades on record"]);
  }
  if (i.daysSinceLastTx > 30) {
    return verdict("Inactive", 0.85, [
      `last tx ${Math.round(i.daysSinceLastTx)}d ago`,
    ]);
  }

  // 2. Sniper Bot
  if (i.avgHoldingHours < 1 && i.tradeCount > 50) {
    reasons.push(`avg hold ${i.avgHoldingHours.toFixed(2)}h`);
    reasons.push(`${i.tradeCount} trades`);
    return verdict("Sniper Bot", 0.85, reasons);
  }

  // 3. Exit Liquidity
  if (
    i.winRatePct < 30 &&
    i.realizedPnlUsd < -1_000 &&
    i.tradeCount > 20
  ) {
    reasons.push(`win rate ${i.winRatePct.toFixed(0)}%`);
    reasons.push(`realized $${Math.round(i.realizedPnlUsd).toLocaleString()}`);
    return verdict("Exit Liquidity", 0.8, reasons);
  }

  // 4. High-Risk Degen (spray + pray)
  if (i.uniqueTokens > 100 && i.winRatePct < 40) {
    reasons.push(`${i.uniqueTokens} unique tokens`);
    reasons.push(`win rate ${i.winRatePct.toFixed(0)}%`);
    return verdict("High-Risk Degen", 0.75, reasons);
  }

  // 5. Hodler (long average hold, low trading)
  if (i.avgHoldingHours > 720 && i.tradeCount < 10) {
    reasons.push(
      `avg hold ${(i.avgHoldingHours / 24).toFixed(1)}d`,
    );
    reasons.push(`only ${i.tradeCount} trades`);
    return verdict("Hodler", 0.8, reasons);
  }

  // 6. Alpha Trader
  if (
    i.winRatePct >= 60 &&
    i.realizedPnlUsd > 50_000 &&
    i.tradeCount > 30
  ) {
    reasons.push(`win rate ${i.winRatePct.toFixed(0)}%`);
    reasons.push(`realized $${Math.round(i.realizedPnlUsd).toLocaleString()}`);
    reasons.push(`${i.tradeCount} trades`);
    return verdict("Alpha Trader", 0.9, reasons);
  }

  // 7. Consistent Earner
  if (
    i.winRatePct >= 50 &&
    i.realizedPnlUsd > 0 &&
    i.tradeCount > 20
  ) {
    reasons.push(`win rate ${i.winRatePct.toFixed(0)}%`);
    reasons.push(`realized $${Math.round(i.realizedPnlUsd).toLocaleString()}`);
    return verdict("Consistent Earner", 0.7, reasons);
  }

  // 8. Sparse data → Hodler
  if (i.tradeCount < 5) {
    return verdict("Hodler", 0.5, [
      `only ${i.tradeCount} trades — insufficient signal, treating as hodler`,
    ]);
  }

  // 9. Fallback
  if (i.realizedPnlUsd > 0) {
    return verdict("Consistent Earner", 0.4, [
      "profitable but doesn't meet Alpha Trader thresholds",
    ]);
  }
  return verdict("High-Risk Degen", 0.4, [
    "active but unprofitable; default classification",
  ]);
}

function verdict(
  label: WalletVerdictLabel,
  confidence: number,
  reasons: string[],
): WalletVerdict {
  return { label, confidence, reasons };
}

/** Tone hint for the verdict badge. */
export function toneFor(
  label: WalletVerdictLabel,
): "success" | "warn" | "danger" | "secondary" {
  switch (label) {
    case "Alpha Trader":
      return "success";
    case "Consistent Earner":
      return "success";
    case "Hodler":
      return "secondary";
    case "Inactive":
      return "secondary";
    case "Sniper Bot":
      return "warn";
    case "High-Risk Degen":
      return "warn";
    case "Exit Liquidity":
      return "danger";
  }
}
