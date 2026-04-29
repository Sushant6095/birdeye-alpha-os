import { and, eq, gte, sql } from "drizzle-orm";
import { creditUsageLog, db, isDbConfigured } from "../db";
import { onCreditUsage, type CreditUsageEvent } from "./client";
import { getBirdeyeContext } from "./context";

let _initialized = false;

/**
 * Subscribe credit observer once and write each successful Birdeye call to
 * `credit_usage_log`. Idempotent — safe to call multiple times.
 */
export function initCreditTracker(): void {
  if (_initialized) return;
  _initialized = true;
  onCreditUsage(handleEvent);
}

/** Record a cache-hit (zero-credit) call so usage logs reflect both layers. */
export function recordCacheHit(opts: {
  endpoint: string;
  chain?: string;
  userId?: string;
}): void {
  if (!isDbConfigured()) return;
  void db
    .insert(creditUsageLog)
    .values({
      endpoint: opts.endpoint,
      chain: opts.chain ?? null,
      credits: 0,
      cacheHit: 1,
      userId: opts.userId ?? null,
    })
    .catch(() => {});
}

function handleEvent(e: CreditUsageEvent) {
  if (!isDbConfigured()) return;
  if (e.status >= 400) return; // don't bill failed calls
  const userId = getBirdeyeContext()?.userId ?? null;
  void db
    .insert(creditUsageLog)
    .values({
      endpoint: e.endpoint,
      chain: e.chain,
      credits: e.cuConsumed ?? 0,
      creditsLeft: e.cuLeft ?? null,
      cacheHit: 0,
      userId,
    })
    .catch(() => {
      // never crash the request on a logging failure
    });
}

/** Sum of credits consumed today (UTC). Optionally scope to a userId. */
export async function getCreditsUsedToday(userId?: string): Promise<number> {
  if (!isDbConfigured()) return 0;
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);

  const where = userId
    ? and(
        gte(creditUsageLog.calledAt, startOfDayUtc),
        eq(creditUsageLog.userId, userId),
      )
    : gte(creditUsageLog.calledAt, startOfDayUtc);

  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${creditUsageLog.credits}), 0)::int` })
    .from(creditUsageLog)
    .where(where);
  return rows[0]?.total ?? 0;
}

/** Last credits-left value Birdeye reported (or null if never seen). */
export async function getCreditsLeftFromLog(): Promise<number | null> {
  if (!isDbConfigured()) return null;
  const rows = await db
    .select({ left: creditUsageLog.creditsLeft })
    .from(creditUsageLog)
    .where(sql`${creditUsageLog.creditsLeft} IS NOT NULL`)
    .orderBy(sql`${creditUsageLog.calledAt} DESC`)
    .limit(1);
  return rows[0]?.left ?? null;
}
