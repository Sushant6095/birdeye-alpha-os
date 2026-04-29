import { NextResponse } from "next/server";
import { BirdeyeError } from "@/lib/birdeye/client";

/**
 * Convert a thrown BirdeyeError / Error into a JSON response with the right
 * status. Use inside route handlers' catch blocks.
 */
export function birdeyeErrorToResponse(err: unknown): Response {
  if (err instanceof BirdeyeError) {
    return NextResponse.json(
      { error: err.message, endpoint: err.endpoint, status: err.status },
      { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
    );
  }
  const msg = err instanceof Error ? err.message : "internal error";
  return NextResponse.json({ error: msg }, { status: 500 });
}

/** Parse `?chain=…` with a default. */
export function chainOf(req: Request, fallback = "solana"): string {
  const url = new URL(req.url);
  return url.searchParams.get("chain") ?? fallback;
}

export function intParam(
  req: Request,
  name: string,
  fallback?: number,
): number | undefined {
  const url = new URL(req.url);
  const v = url.searchParams.get(name);
  if (v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function strParam(req: Request, name: string): string | undefined {
  const url = new URL(req.url);
  const v = url.searchParams.get(name);
  return v ?? undefined;
}
