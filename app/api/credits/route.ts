import { NextResponse } from "next/server";
import {
  getCreditsUsedToday,
  getCreditsLeftFromLog,
} from "@/lib/birdeye/credits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [usedToday, lastLeft] = await Promise.all([
      getCreditsUsedToday(),
      getCreditsLeftFromLog(),
    ]);
    return NextResponse.json({
      usedToday,
      creditsLeft: lastLeft,
      ts: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        usedToday: 0,
        creditsLeft: null,
        error: (err as Error).message,
      },
      { status: 200 },
    );
  }
}
