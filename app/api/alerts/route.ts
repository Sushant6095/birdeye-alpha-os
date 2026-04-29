import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { alertRules, db } from "@/lib/db";
import type { AlertRuleType } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

export type AlertKind =
  | "wallet_activity"
  | "new_listing"
  | "new_pair"
  | "whale_on_watchlist"
  | "token_stats_threshold";

const VALID: ReadonlySet<string> = new Set([
  "wallet_activity",
  "new_listing",
  "new_pair",
  "whale_on_watchlist",
  "token_stats_threshold",
]);

export async function GET(req: Request) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ items: [] });
  const rows = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.userId, userId));
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const userId = await ensureUser(req);
  if (!userId)
    return NextResponse.json({ error: "no user" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    type?: string;
    config?: Record<string, unknown>;
    enabled?: boolean;
  };
  if (!body.type || !VALID.has(body.type))
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  const [row] = await db
    .insert(alertRules)
    .values({
      userId,
      type: body.type as AlertRuleType,
      config: body.config ?? {},
      enabled: body.enabled ?? true,
    })
    .returning();
  return NextResponse.json({ row });
}
