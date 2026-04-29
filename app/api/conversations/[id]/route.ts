import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { aiConversations, db } from "@/lib/db";
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
    .from(aiConversations)
    .where(
      and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
    )
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
    title?: string;
    messages?: unknown[];
  };
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.title === "string") update["title"] = body.title.slice(0, 80);
  if (Array.isArray(body.messages))
    update["messages"] = body.messages as never;
  const [row] = await db
    .update(aiConversations)
    .set(update)
    .where(
      and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
    )
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });
  const { id } = await params;
  await db
    .delete(aiConversations)
    .where(
      and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)),
    );
  return NextResponse.json({ ok: true });
}
