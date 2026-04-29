import { NextResponse } from "next/server";
import { alertHistory, db, isDbConfigured } from "@/lib/db";
import { ensureUser } from "@/lib/user/identity";

export const dynamic = "force-dynamic";

interface FireBody {
  ruleId?: string | null;
  type: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  /** Optional Telegram fan-out — uses the same env as Whale Radar. */
  pushTelegram?: boolean;
}

export async function POST(req: Request) {
  if (!isDbConfigured())
    return NextResponse.json({ ok: true, persisted: false });
  const userId = await ensureUser(req);
  if (!userId)
    return NextResponse.json({ error: "no user" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as FireBody;
  if (!body.type || !body.title)
    return NextResponse.json({ error: "type+title required" }, { status: 400 });

  const [row] = await db
    .insert(alertHistory)
    .values({
      userId,
      ruleId: body.ruleId ?? null,
      type: body.type,
      title: body.title,
      body: body.body ?? null,
      payload: body.payload ?? null,
    })
    .returning();

  if (body.pushTelegram) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      void fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `*${body.title}*${body.body ? `\n${body.body}` : ""}`,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ row, persisted: true });
}
