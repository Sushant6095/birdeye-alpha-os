import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { alertRules, db } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    enabled?: boolean;
    config?: Record<string, unknown>;
  };
  const update: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") update["enabled"] = body.enabled;
  if (body.config) update["config"] = body.config;
  const [row] = await db
    .update(alertRules)
    .set(update)
    .where(and(eq(alertRules.id, id), eq(alertRules.userId, userId)))
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ row });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const userId = await ensureUser(req);
  if (!userId) return NextResponse.json({ error: "no user" }, { status: 401 });
  const { id } = await params;
  await db
    .delete(alertRules)
    .where(and(eq(alertRules.id, id), eq(alertRules.userId, userId)));
  return NextResponse.json({ ok: true });
}
