import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db";
import { cachePing } from "@/lib/cache/redis";
import { getLegacyNetworks } from "@/lib/birdeye";
import { BirdeyeError } from "@/lib/birdeye/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CheckResult {
  ok: boolean;
  detail?: string;
  latencyMs?: number;
}

async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; latencyMs: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, latencyMs: Math.round(performance.now() - start) };
}

async function checkDb(): Promise<CheckResult> {
  if (!isDbConfigured()) {
    return { ok: false, detail: "DATABASE_URL not configured" };
  }
  try {
    const { latencyMs } = await timed(() => db.execute(sql`select 1 as ok`));
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

async function checkCache(): Promise<CheckResult & { layer?: string }> {
  try {
    const { result, latencyMs } = await timed(() => cachePing());
    return { ok: result.ok, detail: result.detail, latencyMs, layer: result.layer };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

async function checkBirdeye(): Promise<CheckResult> {
  if (!process.env.BIRDEYE_API_KEY) {
    return { ok: false, detail: "BIRDEYE_API_KEY not configured" };
  }
  try {
    const { latencyMs } = await timed(() => getLegacyNetworks());
    return { ok: true, latencyMs };
  } catch (err) {
    if (err instanceof BirdeyeError) {
      return { ok: false, detail: `${err.status} ${err.message}` };
    }
    return { ok: false, detail: (err as Error).message };
  }
}

export async function GET() {
  const [dbCheck, cacheCheck, birdeyeCheck] = await Promise.all([
    checkDb(),
    checkCache(),
    checkBirdeye(),
  ]);

  const allOk = dbCheck.ok && cacheCheck.ok && birdeyeCheck.ok;
  const status = allOk ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      checks: {
        db: dbCheck,
        cache: cacheCheck,
        birdeye: birdeyeCheck,
      },
      ts: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
