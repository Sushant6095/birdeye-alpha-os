import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { aiConversations, db } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ items: [] });
  const rows = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(sql`${aiConversations.updatedAt} DESC`)
    .limit(50);
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const userId = await ensureUser(req);
  if (!userId)
    return NextResponse.json({ error: "no user" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    messages?: unknown[];
  };
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const title = (body.title ?? "New chat").slice(0, 80);
  const [row] = await db
    .insert(aiConversations)
    .values({
      userId,
      title,
      // schema typed as AiMessage[] but we treat it as opaque JSON here
      messages: messages as never,
    })
    .returning();
  return NextResponse.json({ row });
}
