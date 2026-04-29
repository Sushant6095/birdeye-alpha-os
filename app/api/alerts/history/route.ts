import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { alertHistory, db, isDbConfigured } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ items: [] });
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ items: [] });
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(alertHistory)
    .where(
      and(
        eq(alertHistory.userId, userId),
        gte(alertHistory.firedAt, sevenDaysAgo),
      ),
    )
    .orderBy(sql`${alertHistory.firedAt} DESC`)
    .limit(200);
  return NextResponse.json({ items: rows });
}
