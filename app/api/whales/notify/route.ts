import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface NotifyBody {
  text?: string;
  meta?: Record<string, unknown>;
}

/**
 * Optional Telegram push. Only fires when both TELEGRAM_BOT_TOKEN and
 * TELEGRAM_CHAT_ID are set in env. Otherwise returns 204 silently — the
 * client can call this on every whale event without configuration churn.
 */
export async function POST(req: Request) {
  let body: NotifyBody = {};
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    /* swallow */
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return new NextResponse(null, { status: 204 });
  }
  const text = body.text ?? "[alphaos] whale event";
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      },
    );
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `telegram ${r.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
