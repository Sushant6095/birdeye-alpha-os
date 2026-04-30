import { NextResponse } from "next/server";
import { BirdeyeError } from "@/lib/birdeye/client";
import { apiError } from "./error";
import { makeLogger, type Logger } from "@/lib/log";

/**
 * Convert a thrown BirdeyeError / Error into the standard JSON error envelope.
 *
 * Pass `route` so the log line attributes correctly. Old call sites that
 * didn't pass a route will still get a generic envelope.
 */
export function birdeyeErrorToResponse(err: unknown, route = "api"): Response {
  return apiError(err, { route });
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

/**
 * Wrap a route handler with structured logging + standard error envelope.
 * Logs an `info` line on success with duration; converts any thrown error
 * into the friendly envelope.
 *
 * Usage:
 *   export const GET = withLog("discover/trending", async (req) => { … });
 */
export function withLog<Args extends unknown[]>(
  route: string,
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  const log = makeLogger(`api/${route}`);
  return async (req: Request, ...args: Args): Promise<Response> => {
    const t0 = performance.now();
    const url = new URL(req.url);
    const chain = url.searchParams.get("chain") ?? undefined;
    try {
      const res = await handler(req, ...args);
      const ms = Math.round(performance.now() - t0);
      log.info(`${req.method} ${url.pathname}`, {
        status: res.status,
        ms,
        chain,
      });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      log.error(`${req.method} ${url.pathname} failed`, {
        ms,
        chain,
        err: err instanceof Error ? err.message : String(err),
        endpoint: err instanceof BirdeyeError ? err.endpoint : undefined,
        upstreamStatus: err instanceof BirdeyeError ? err.status : undefined,
      });
      return apiError(err, { route, chain });
    }
  };
}

/** Inline logger for ad-hoc work in a route handler. */
export function routeLogger(route: string): Logger {
  return makeLogger(`api/${route}`);
}

/** 200 JSON helper. */
export function ok<T>(body: T): Response {
  return NextResponse.json(body);
}
