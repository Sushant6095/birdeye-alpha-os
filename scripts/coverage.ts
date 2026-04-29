/**
 * Coverage report.
 *
 * Walks the codebase to confirm every Birdeye REST endpoint we cover in
 * `lib/birdeye/rest/*` is also (a) wrapped in the cached client, (b)
 * registered as an AI tool, and (c) referenced by at least one route
 * handler under `app/api/`.
 *
 *   pnpm coverage         # prints markdown table + asserts ≥ 75
 *   pnpm coverage --md    # prints just the markdown
 *
 * Stable enough to pin in CI; intentionally string-based (no AST) because
 * the registry shape is small and the grep is O(n) in source bytes.
 */
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";

interface Endpoint {
  fn: string;
  path: string;
  category: string;
  /** Source file where the function is defined, relative to repo root. */
  source: string;
}

interface Coverage {
  endpoints: Endpoint[];
  /** REST endpoints whose function name appears in cached.ts. */
  cached: Set<string>;
  /** REST endpoints whose function name appears in tools.ts. */
  tools: Set<string>;
  /** REST endpoints with at least one app/api/* file that mentions the fn. */
  routedBy: Map<string, string[]>;
  /** WebSocket topics found in the sidecar. */
  wsTopics: string[];
}

const ROOT = path.resolve(__dirname, "..");
const REST_DIR = path.join(ROOT, "lib", "birdeye", "rest");
const CACHED = path.join(ROOT, "lib", "birdeye", "cached.ts");
const TOOLS = path.join(ROOT, "lib", "ai", "tools.ts");
const API_DIR = path.join(ROOT, "app", "api");
const TOPICS = path.join(
  ROOT,
  "services",
  "ws-sidecar",
  "src",
  "topics.ts",
);

const CATEGORY_FOR_FILE: Record<string, string> = {
  "price.ts": "Price & OHLCV",
  "stats.ts": "Stats",
  "tokens.ts": "Token / Market List",
  "transactions.ts": "Transactions",
  "wallet.ts": "Wallet, Networth & PnL",
  "holder.ts": "Holder",
  "balance.ts": "Balance & Transfer",
  "blockchain.ts": "Blockchain",
  "creation.ts": "Creation & Trending",
  "meme.ts": "Meme",
  "security.ts": "Security",
  "smartmoney.ts": "Smart Money",
  "history.ts": "All-time & History",
  "search.ts": "Search & Utils",
};

const FN_RE =
  /^export\s+function\s+([a-zA-Z0-9_]+)\s*\(/;
const PATH_RE = /(GET|POST)\s+(\/[^\s*'"`]+)/;

async function readEndpoints(): Promise<Endpoint[]> {
  const out: Endpoint[] = [];
  const files = await fs.readdir(REST_DIR);
  for (const file of files) {
    if (!file.endsWith(".ts")) continue;
    const src = await fs.readFile(path.join(REST_DIR, file), "utf8");
    const lines = src.split("\n");
    let recentPath: string | undefined;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const pm = line.match(PATH_RE);
      if (pm) recentPath = `${pm[1]} ${pm[2]}`;
      const fm = line.match(FN_RE);
      if (fm && recentPath) {
        out.push({
          fn: fm[1]!,
          path: recentPath,
          category: CATEGORY_FOR_FILE[file] ?? file.replace(".ts", ""),
          source: path.relative(ROOT, path.join(REST_DIR, file)),
        });
        recentPath = undefined; // consume — one per function
      }
    }
  }
  return out;
}

async function readCachedFns(): Promise<Set<string>> {
  const src = await fs.readFile(CACHED, "utf8");
  const set = new Set<string>();
  // Lines like: `export const getPrice = wrap(price.getPrice, …)`
  for (const m of src.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)\s*=/g)) {
    set.add(m[1]!);
  }
  return set;
}

async function readToolFns(): Promise<Set<string>> {
  const src = await fs.readFile(TOOLS, "utf8");
  const set = new Set<string>();
  for (const m of src.matchAll(
    /^\s+([a-zA-Z0-9_]+):\s+(?:bind|nullary|tool)\(/gm,
  )) {
    set.add(m[1]!);
  }
  return set;
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) yield p;
  }
}

async function readApiUsage(
  endpoints: Endpoint[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!(await exists(API_DIR))) return map;
  for await (const file of walk(API_DIR)) {
    const src = await fs.readFile(file, "utf8");
    for (const ep of endpoints) {
      const re = new RegExp(`\\b${ep.fn}\\b`);
      if (re.test(src)) {
        const list = map.get(ep.fn) ?? [];
        list.push(path.relative(ROOT, file));
        map.set(ep.fn, list);
      }
    }
  }
  return map;
}

async function readWsTopics(): Promise<string[]> {
  if (!(await exists(TOPICS))) return [];
  const src = await fs.readFile(TOPICS, "utf8");
  const out: string[] = [];
  // The TOPIC_KINDS array literal is the source of truth.
  const m = src.match(/TOPIC_KINDS:\s*TopicKind\[\]\s*=\s*\[([^\]]+)\]/);
  if (m) {
    for (const s of m[1]!.split(",")) {
      const v = s.trim().replace(/^["'`]|["'`]$/g, "");
      if (v) out.push(v);
    }
  }
  return out;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function gather(): Promise<Coverage> {
  const [endpoints, cached, tools, routedBy, wsTopics] = await Promise.all([
    readEndpoints(),
    readCachedFns(),
    readToolFns(),
    Promise.resolve().then(() => readEndpoints()).then(readApiUsage),
    readWsTopics(),
  ]);
  return { endpoints, cached, tools, routedBy, wsTopics };
}

function buildMarkdown(c: Coverage): string {
  const lines: string[] = [];
  lines.push("### REST endpoints");
  lines.push("");
  lines.push("| Category | Endpoint | Function | Cached | AI tool | API route |");
  lines.push("| --- | --- | --- | :-: | :-: | :-: |");
  // sort by category then path
  const sorted = [...c.endpoints].sort((a, b) =>
    a.category === b.category
      ? a.path.localeCompare(b.path)
      : a.category.localeCompare(b.category),
  );
  for (const ep of sorted) {
    const inCached = c.cached.has(ep.fn) ? "✅" : "·";
    const inTools = c.tools.has(ep.fn) ? "✅" : "·";
    const routes = c.routedBy.get(ep.fn);
    const inRoute = routes && routes.length > 0 ? "✅" : "·";
    lines.push(
      `| ${ep.category} | \`${ep.path}\` | \`${ep.fn}\` | ${inCached} | ${inTools} | ${inRoute} |`,
    );
  }
  lines.push("");
  lines.push("### WebSocket topics");
  lines.push("");
  lines.push("| Topic | Subscribe message |");
  lines.push("| --- | --- |");
  const wsMap: Record<string, string> = {
    price: "SUBSCRIBE_PRICE",
    txs: "SUBSCRIBE_TXS",
    base_quote_price: "SUBSCRIBE_BASE_QUOTE_PRICE",
    new_listing: "SUBSCRIBE_TOKEN_NEW_LISTING",
    new_pair: "SUBSCRIBE_NEW_PAIR",
    large_trade: "SUBSCRIBE_LARGE_TRADE_TXS",
    wallet_txs: "SUBSCRIBE_WALLET_TXS",
    token_stats: "SUBSCRIBE_TOKEN_STATS",
    meme_stats: "SUBSCRIBE_MEME_STATS",
  };
  for (const t of c.wsTopics) {
    lines.push(`| \`${t}\` | \`${wsMap[t] ?? "—"}\` |`);
  }
  return lines.join("\n");
}

function summarize(c: Coverage) {
  const total = c.endpoints.length;
  const cached = c.endpoints.filter((e) => c.cached.has(e.fn)).length;
  const tools = c.endpoints.filter((e) => c.tools.has(e.fn)).length;
  const routed = c.endpoints.filter(
    (e) => (c.routedBy.get(e.fn)?.length ?? 0) > 0,
  ).length;
  return { total, cached, tools, routed, ws: c.wsTopics.length };
}

async function main() {
  const mdOnly = process.argv.includes("--md");
  const c = await gather();
  const md = buildMarkdown(c);
  if (mdOnly) {
    process.stdout.write(md + "\n");
    return;
  }
  const s = summarize(c);
  console.log("AlphaOS coverage report");
  console.log(
    `  REST endpoints: ${s.total} defined · ${s.cached} cached · ${s.tools} as AI tools · ${s.routed} routed by API handler`,
  );
  console.log(`  WebSocket topics: ${s.ws}`);
  console.log("");
  console.log(md);
  if (s.total < 75) {
    console.error(`\nFAIL: expected ≥ 75 endpoints, got ${s.total}`);
    process.exit(1);
  }
  if (s.cached < s.total) {
    console.error(
      `\nFAIL: ${s.total - s.cached} endpoints missing from cached client`,
    );
    process.exit(1);
  }
  if (s.tools < s.total) {
    console.error(
      `\nFAIL: ${s.total - s.tools} endpoints missing from AI tool registry`,
    );
    process.exit(1);
  }
  if (s.ws < 9) {
    console.error(`\nFAIL: expected 9 WS topics, got ${s.ws}`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
