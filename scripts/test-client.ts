/**
 * End-to-end smoke test for the Birdeye client.
 * Hits 5 representative endpoints against SOL on Solana.
 *
 *   pnpm test:client
 *   # or: tsx scripts/test-client.ts
 *
 * Requires BIRDEYE_API_KEY in .env or process env.
 */
import "dotenv/config";

import {
  getPrice,
  getTokenOverview,
  getTokenHolder,
  getWalletNetworth,
  search,
  BirdeyeError,
} from "../lib/birdeye";

const SOL_MINT = "So11111111111111111111111111111111111111112";
// Public Solana wallet with diversified holdings (FTX hot-wallet-ish; any large mint works).
const TEST_WALLET = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";

type TestResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  preview?: unknown;
  error?: string;
};

async function run<T>(name: string, fn: () => Promise<T>): Promise<TestResult> {
  const start = performance.now();
  try {
    const data = await fn();
    return {
      name,
      ok: true,
      durationMs: Math.round(performance.now() - start),
      preview: previewOf(data),
    };
  } catch (err) {
    const msg =
      err instanceof BirdeyeError
        ? `${err.status} ${err.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      name,
      ok: false,
      durationMs: Math.round(performance.now() - start),
      error: msg,
    };
  }
}

function previewOf(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v !== "object") return v;
  // Trim arrays so the log isn't a wall
  if (Array.isArray(v)) return v.slice(0, 2);
  const out: Record<string, unknown> = {};
  let i = 0;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (i++ >= 8) break;
    out[k] = Array.isArray(val) ? `[Array(${val.length})]` : val;
  }
  return out;
}

async function main() {
  if (!process.env.BIRDEYE_API_KEY) {
    console.error(
      "BIRDEYE_API_KEY missing. Copy .env.example → .env and add your key.",
    );
    process.exit(1);
  }
  process.env.BIRDEYE_DEBUG = process.env.BIRDEYE_DEBUG ?? "1";

  const results: TestResult[] = [];

  results.push(
    await run("price", () => getPrice({ address: SOL_MINT }, "solana")),
  );
  results.push(
    await run("token_overview", () =>
      getTokenOverview({ address: SOL_MINT }, "solana"),
    ),
  );
  results.push(
    await run("holder_list", () =>
      getTokenHolder({ address: SOL_MINT, limit: 5 }, "solana"),
    ),
  );
  results.push(
    await run("wallet_networth", () =>
      getWalletNetworth({ wallet: TEST_WALLET }, "solana"),
    ),
  );
  results.push(
    await run("search", () =>
      search({ keyword: "SOL", target: "token", limit: 5 }, "solana"),
    ),
  );

  console.log("\n=== Birdeye client smoke test ===");
  for (const r of results) {
    const tag = r.ok ? "✅" : "❌";
    console.log(`${tag} ${r.name.padEnd(18)} ${r.durationMs}ms`);
    if (r.ok) console.log("   →", JSON.stringify(r.preview));
    else console.log("   error:", r.error);
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
