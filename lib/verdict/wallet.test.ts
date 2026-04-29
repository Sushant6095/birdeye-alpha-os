import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyWallet,
  type WalletVerdictInputs,
  type WalletVerdictLabel,
} from "./wallet";

function inputs(over: Partial<WalletVerdictInputs>): WalletVerdictInputs {
  return {
    realizedPnlUsd: 0,
    unrealizedPnlUsd: 0,
    totalVolumeUsd: 0,
    tradeCount: 0,
    winRatePct: 0,
    avgHoldingHours: 24,
    uniqueTokens: 0,
    daysSinceFirstTx: 90,
    daysSinceLastTx: 1,
    ...over,
  };
}

const cases: Array<{
  name: string;
  i: Partial<WalletVerdictInputs>;
  expected: WalletVerdictLabel;
}> = [
  {
    name: "zero-activity wallet → Inactive",
    i: { tradeCount: 0 },
    expected: "Inactive",
  },
  {
    name: "dormant wallet → Inactive",
    i: { tradeCount: 25, daysSinceLastTx: 90, winRatePct: 60 },
    expected: "Inactive",
  },
  {
    name: "high-frequency flipper → Sniper Bot",
    i: {
      tradeCount: 200,
      avgHoldingHours: 0.4,
      winRatePct: 55,
      realizedPnlUsd: 5_000,
      uniqueTokens: 80,
    },
    expected: "Sniper Bot",
  },
  {
    name: "long hold, few trades → Hodler",
    i: {
      tradeCount: 3,
      avgHoldingHours: 24 * 90,
      winRatePct: 0,
      realizedPnlUsd: 12_000,
    },
    expected: "Hodler",
  },
  {
    name: "stellar trader → Alpha Trader",
    i: {
      tradeCount: 60,
      avgHoldingHours: 12,
      winRatePct: 70,
      realizedPnlUsd: 200_000,
      uniqueTokens: 30,
    },
    expected: "Alpha Trader",
  },
  {
    name: "modest profitable → Consistent Earner",
    i: {
      tradeCount: 40,
      avgHoldingHours: 24,
      winRatePct: 55,
      realizedPnlUsd: 8_000,
      uniqueTokens: 25,
    },
    expected: "Consistent Earner",
  },
  {
    name: "bag holder → Exit Liquidity",
    i: {
      tradeCount: 30,
      avgHoldingHours: 6,
      winRatePct: 20,
      realizedPnlUsd: -5_000,
      uniqueTokens: 25,
    },
    expected: "Exit Liquidity",
  },
  {
    name: "spray and pray → High-Risk Degen",
    i: {
      tradeCount: 80,
      avgHoldingHours: 4,
      winRatePct: 35,
      realizedPnlUsd: 2_000,
      uniqueTokens: 150,
    },
    expected: "High-Risk Degen",
  },
  {
    name: "sparse activity → Hodler fallback",
    i: {
      tradeCount: 4,
      avgHoldingHours: 48,
      winRatePct: 50,
      realizedPnlUsd: -100,
      uniqueTokens: 4,
    },
    expected: "Hodler",
  },
  {
    name: "active but unprofitable → High-Risk Degen fallback",
    i: {
      tradeCount: 30,
      avgHoldingHours: 8,
      winRatePct: 45,
      realizedPnlUsd: -200,
      uniqueTokens: 10,
    },
    expected: "High-Risk Degen",
  },
];

for (const c of cases) {
  test(c.name, () => {
    const v = classifyWallet(inputs(c.i));
    assert.equal(v.label, c.expected, `expected ${c.expected}, got ${v.label}`);
    assert.ok(v.confidence > 0 && v.confidence <= 1);
    assert.ok(Array.isArray(v.reasons));
  });
}

test("determinism — same input twice yields same output", () => {
  const i = inputs({
    tradeCount: 60,
    winRatePct: 70,
    realizedPnlUsd: 200_000,
    avgHoldingHours: 12,
  });
  const a = classifyWallet(i);
  const b = classifyWallet(i);
  assert.deepEqual(a, b);
});
