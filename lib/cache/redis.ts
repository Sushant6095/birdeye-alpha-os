import { Redis } from "@upstash/redis";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, cachedResponses, isDbConfigured } from "../db";

let _client: Redis | null = null;
let _disabled = false;

function getClient(): Redis | null {
  if (_disabled) return null;
  if (_client) return _client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _disabled = true;
    return null;
  }
  _client = new Redis({ url, token });
  return _client;
}

const DEBUG = process.env.CACHE_DEBUG === "1" || process.env.CACHE_DEBUG === "true";

function dbg(...args: unknown[]) {
  if (DEBUG) console.log("[cache]", ...args);
}

/** Read from Redis. On Redis failure, fall back to Postgres `cached_responses`. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getClient();
  if (client) {
    try {
      const v = await client.get<T>(key);
      if (v != null) {
        dbg("HIT (redis)", key);
        return v;
      }
    } catch (err) {
      dbg("redis get failed, falling back to db:", (err as Error).message);
    }
  }
  if (!isDbConfigured()) return null;
  try {
    const rows = await db
      .select()
      .from(cachedResponses)
      .where(
        and(
          eq(cachedResponses.key, key),
          gte(cachedResponses.expiresAt, new Date()),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    // bump hit count async, fire-and-forget
    void db
      .update(cachedResponses)
      .set({ hitCount: sql`${cachedResponses.hitCount} + 1` })
      .where(eq(cachedResponses.key, key))
      .catch(() => {});
    dbg("HIT (db fallback)", key);
    return row.payload as T;
  } catch (err) {
    dbg("db cache lookup failed:", (err as Error).message);
    return null;
  }
}

/** Write to Redis (with TTL). Mirror to Postgres if configured. */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSec: number,
): Promise<void> {
  const client = getClient();
  if (client) {
    try {
      await client.set(key, value, { ex: ttlSec });
    } catch (err) {
      dbg("redis set failed:", (err as Error).message);
    }
  }
  if (isDbConfigured()) {
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    try {
      await db
        .insert(cachedResponses)
        .values({ key, payload: value as unknown, expiresAt })
        .onConflictDoUpdate({
          target: cachedResponses.key,
          set: { payload: value as unknown, expiresAt },
        });
    } catch (err) {
      dbg("db cache write failed:", (err as Error).message);
    }
  }
}

/** Best-effort delete from both layers. */
export async function cacheDel(key: string): Promise<void> {
  const client = getClient();
  if (client) {
    try {
      await client.del(key);
    } catch {
      /* swallow */
    }
  }
  if (isDbConfigured()) {
    try {
      await db.delete(cachedResponses).where(eq(cachedResponses.key, key));
    } catch {
      /* swallow */
    }
  }
}

/** Ping Redis. Used by health checks. */
export async function cachePing(): Promise<{
  ok: boolean;
  layer: "redis" | "db" | "none";
  detail?: string;
}> {
  const client = getClient();
  if (client) {
    try {
      const v = await client.ping();
      return { ok: v === "PONG", layer: "redis", detail: String(v) };
    } catch (err) {
      return { ok: false, layer: "redis", detail: (err as Error).message };
    }
  }
  if (isDbConfigured()) {
    return { ok: true, layer: "db", detail: "redis disabled, using db fallback" };
  }
  return { ok: false, layer: "none", detail: "no cache layer configured" };
}
