import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, watchlists, type WatchlistItem } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ items: [] });
  const rows = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId));
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const userId = await ensureUser(req);
  if (!userId)
    return NextResponse.json({ error: "user not configured" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    items?: WatchlistItem[];
  };
  const name = (body.name ?? "Untitled").slice(0, 64);
  const items = (body.items ?? []).slice(0, 50);
  const [row] = await db
    .insert(watchlists)
    .values({ userId, name, items })
    .returning();
  return NextResponse.json({ row });
}
