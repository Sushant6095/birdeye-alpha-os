import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, watchlists, type WatchlistItem } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });
  const { id } = await params;
  const rows = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)))
    .limit(1);
  if (rows.length === 0)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ row: rows[0] });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    items?: WatchlistItem[];
  };
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string") update["name"] = body.name.slice(0, 64);
  if (Array.isArray(body.items)) update["items"] = body.items.slice(0, 50);
  const [row] = await db
    .update(watchlists)
    .set(update)
    .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)))
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });
  const { id } = await params;
  await db
    .delete(watchlists)
    .where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)));
  return NextResponse.json({ ok: true });
}
