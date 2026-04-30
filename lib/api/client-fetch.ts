"use client";

import { toast } from "sonner";
import type { ApiErrorBody, ApiErrorCode } from "./error";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly hint?: string;
  readonly status?: number;
  readonly endpoint?: string;
  readonly chain?: string;
  readonly httpStatus: number;

  constructor(body: ApiErrorBody, httpStatus: number) {
    super(body.error.message);
    this.name = "ApiError";
    this.code = body.error.code;
    this.hint = body.error.hint;
    this.status = body.error.status;
    this.endpoint = body.error.endpoint;
    this.chain = body.error.chain;
    this.httpStatus = httpStatus;
  }
}

interface FetchOpts extends RequestInit {
  /**
   * If false, the helper does not toast on error — caller handles it.
   * Defaults to true.
   */
  toastOnError?: boolean;
  /** Override the toast title (e.g. "Couldn't load trending tokens"). */
  toastTitle?: string;
}

function isApiErrorBody(j: unknown): j is ApiErrorBody {
  return (
    typeof j === "object" &&
    j !== null &&
    typeof (j as { error?: unknown }).error === "object" &&
    typeof (j as { error: { code?: unknown } }).error.code === "string"
  );
}

export async function apiFetch<T = unknown>(
  url: string,
  opts: FetchOpts = {},
): Promise<T> {
  const { toastOnError = true, toastTitle, ...init } = opts;
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const message = "Network error reaching the server.";
    if (toastOnError) toast.error(toastTitle ?? message, { description: "Check your connection and retry." });
    throw new ApiError(
      { error: { code: "internal_error", message, hint: "Check your connection." } },
      0,
    );
  }

  // Some routes (chats, conversations) are not JSON.
  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    if (isJson) {
      try {
        const j = await res.json();
        if (isApiErrorBody(j)) body = j;
        else body = { error: { code: "internal_error", message: typeof j === "object" && j && "error" in j && typeof (j as { error?: unknown }).error === "string" ? (j as { error: string }).error : `HTTP ${res.status}` } };
      } catch {
        body = { error: { code: "internal_error", message: `HTTP ${res.status}` } };
      }
    } else {
      body = { error: { code: "internal_error", message: `HTTP ${res.status}` } };
    }
    if (toastOnError) {
      const action =
        body.error.code === "chain_unsupported"
          ? {
              label: "Switch to Solana",
              onClick: () => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("alphaos:switch-chain", {
                      detail: { chain: "solana" },
                    }),
                  );
                }
              },
            }
          : undefined;
      toast.error(toastTitle ?? body.error.message, {
        description: body.error.hint,
        action,
      });
    }
    throw new ApiError(body, res.status);
  }

  if (!isJson) return undefined as T;
  return (await res.json()) as T;
}

/** Toast a friendly message for an `ApiError` outside the fetcher. */
export function toastApiError(err: unknown, fallbackTitle = "Something went wrong") {
  if (err instanceof ApiError) {
    toast.error(err.message || fallbackTitle, { description: err.hint });
    return;
  }
  if (err instanceof Error) {
    toast.error(fallbackTitle, { description: err.message });
    return;
  }
  toast.error(fallbackTitle);
}
