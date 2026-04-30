import { NextResponse } from "next/server";
import { BirdeyeError } from "@/lib/birdeye/client";
import { makeLogger } from "@/lib/log";

const log = makeLogger("api");

/**
 * Stable error envelope returned by every /api/* route.
 *
 * Frontend reads `code` to map to a friendly toast and `hint` for the action
 * the user can take ("Switch to Solana", "Wait 60s", …).
 */
export interface ApiErrorBody {
  error: {
    /** Stable machine-readable code; safe to switch on. */
    code: ApiErrorCode;
    /** Human-readable message — already user-friendly. */
    message: string;
    /** Suggested next action ("Switch to Solana", etc.). */
    hint?: string;
    /** Original HTTP status from upstream (for debugging). */
    status?: number;
    /** Birdeye endpoint the error came from. */
    endpoint?: string;
    /** Chain at the time of the call. */
    chain?: string;
  };
}

export type ApiErrorCode =
  | "rate_limited"
  | "chain_unsupported"
  | "premium_required"
  | "not_found"
  | "invalid_address"
  | "invalid_input"
  | "upstream_error"
  | "upstream_unavailable"
  | "internal_error"
  | "unauthorized";

interface ResolvedError {
  code: ApiErrorCode;
  message: string;
  hint?: string;
  httpStatus: number;
  upstreamStatus?: number;
  endpoint?: string;
  chain?: string;
  raw?: unknown;
}

const CHAIN_UNSUPPORTED_RE = /chain\s+\w+\s+is\s+not\s+supported/i;
const PREMIUM_RE = /(premium|plan|tier|upgrade)/i;
const NOT_FOUND_RE = /not\s+found/i;

function classify(err: unknown): ResolvedError {
  if (err instanceof BirdeyeError) {
    const status = err.status;
    const bodyMsg = extractBodyMessage(err.body);

    // Zod input errors are status=0 in this codebase.
    if (status === 0) {
      return {
        code: "invalid_input",
        message: "Request parameters are invalid for this endpoint.",
        hint: "This is usually a UI bug — please report it.",
        httpStatus: 400,
        upstreamStatus: 0,
        endpoint: err.endpoint,
        chain: err.chain,
        raw: err.body,
      };
    }

    if (status === 429) {
      return {
        code: "rate_limited",
        message: "Birdeye rate limit hit (60 requests / minute).",
        hint: "Wait ~60s — the cache will absorb the next visit.",
        httpStatus: 429,
        upstreamStatus: 429,
        endpoint: err.endpoint,
        chain: err.chain,
      };
    }
    if (status === 401 || status === 403) {
      return {
        code: "unauthorized",
        message: "Birdeye rejected the API key.",
        hint: "Check BIRDEYE_API_KEY is set and not revoked.",
        httpStatus: 401,
        upstreamStatus: status,
        endpoint: err.endpoint,
        chain: err.chain,
      };
    }
    if (CHAIN_UNSUPPORTED_RE.test(bodyMsg) || CHAIN_UNSUPPORTED_RE.test(err.message)) {
      return {
        code: "chain_unsupported",
        message: `Birdeye doesn't expose this endpoint on ${err.chain} for your tier.`,
        hint: "Switch the chain selector to Solana — full coverage on the free tier.",
        httpStatus: 422,
        upstreamStatus: status,
        endpoint: err.endpoint,
        chain: err.chain,
      };
    }
    if (status === 404 || NOT_FOUND_RE.test(bodyMsg)) {
      // /defi/v3/meme/list & some premium endpoints 404 on standard tier.
      if (PREMIUM_RE.test(bodyMsg) || isPremiumEndpoint(err.endpoint)) {
        return {
          code: "premium_required",
          message: "This endpoint needs a higher Birdeye tier.",
          hint: "Try a non-premium surface (Discover, Token Lens basics, Trade Tape).",
          httpStatus: 402,
          upstreamStatus: status,
          endpoint: err.endpoint,
          chain: err.chain,
        };
      }
      return {
        code: "not_found",
        message: "Birdeye has no data for this address on this chain.",
        hint: "Verify the address belongs to the selected chain.",
        httpStatus: 404,
        upstreamStatus: status,
        endpoint: err.endpoint,
        chain: err.chain,
      };
    }
    if (status === 400) {
      return {
        code: "invalid_address",
        message: "Birdeye rejected the address for this chain.",
        hint: "Solana = base58 (~44 chars). EVM = 0x… hex. Ensure URL chain matches.",
        httpStatus: 400,
        upstreamStatus: 400,
        endpoint: err.endpoint,
        chain: err.chain,
      };
    }
    if (status >= 500 && status < 600) {
      return {
        code: "upstream_unavailable",
        message: "Birdeye returned a server error.",
        hint: "Transient — try again in a few seconds.",
        httpStatus: 502,
        upstreamStatus: status,
        endpoint: err.endpoint,
        chain: err.chain,
      };
    }
    return {
      code: "upstream_error",
      message: err.message,
      httpStatus: status >= 400 && status < 600 ? status : 502,
      upstreamStatus: status,
      endpoint: err.endpoint,
      chain: err.chain,
      raw: err.body,
    };
  }

  if (err instanceof Error) {
    return {
      code: "internal_error",
      message: err.message || "Internal server error.",
      hint: "Check server logs.",
      httpStatus: 500,
    };
  }

  return {
    code: "internal_error",
    message: String(err),
    httpStatus: 500,
  };
}

function extractBodyMessage(body: unknown): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (typeof body === "object" && body !== null) {
    const m = (body as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

function isPremiumEndpoint(path: string): boolean {
  // Empirically observed: meme list/trending and some v3/networks variants
  // are not exposed on the free Standard tier.
  return /\/defi\/v3\/(meme|networks)/.test(path);
}

/**
 * Convert any error into a `Response` with the standard envelope.
 * Pass a logger scope so the line shows up under the right route.
 */
export function apiError(
  err: unknown,
  scope: { route: string; chain?: string; userId?: string } = { route: "unknown" },
): Response {
  const r = classify(err);
  const payload: ApiErrorBody = {
    error: {
      code: r.code,
      message: r.message,
      hint: r.hint,
      status: r.upstreamStatus,
      endpoint: r.endpoint,
      chain: r.chain ?? scope.chain,
    },
  };
  log.error(scope.route, {
    code: r.code,
    upstreamStatus: r.upstreamStatus,
    endpoint: r.endpoint,
    chain: r.chain ?? scope.chain,
    userId: scope.userId,
    msg: r.message,
  });
  return NextResponse.json(payload, { status: r.httpStatus });
}

/** Build a fresh ApiErrorBody without throwing. Useful for partial-success responses. */
export function buildApiError(err: unknown, fallback?: Partial<ResolvedError>): ApiErrorBody {
  const r = classify(err);
  return {
    error: {
      code: r.code,
      message: r.message,
      hint: r.hint,
      status: r.upstreamStatus ?? fallback?.upstreamStatus,
      endpoint: r.endpoint ?? fallback?.endpoint,
      chain: r.chain ?? fallback?.chain,
    },
  };
}
