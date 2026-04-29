import { z } from "zod";
import {
  type BirdeyeChain,
  BirdeyeChainSchema,
  DEFAULT_CHAIN,
} from "./types/chain";

const DEFAULT_BASE_URL = "https://public-api.birdeye.so";

/** Structured error thrown by all Birdeye client calls. */
export class BirdeyeError extends Error {
  public readonly status: number;
  public readonly endpoint: string;
  public readonly chain: BirdeyeChain;
  public readonly body: unknown;
  public override readonly cause?: unknown;

  constructor(opts: {
    message: string;
    status: number;
    endpoint: string;
    chain: BirdeyeChain;
    body?: unknown;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "BirdeyeError";
    this.status = opts.status;
    this.endpoint = opts.endpoint;
    this.chain = opts.chain;
    this.body = opts.body;
    this.cause = opts.cause;
  }
}

interface CallOpts<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny> {
  /** path starting with `/`, e.g. `/defi/price` */
  path: string;
  method: "GET" | "POST";
  /** zod schema validated against the merged params/body before send */
  input?: TInput;
  /** zod schema validated against `data` field of envelope */
  output: TOutput;
  /** GET query params */
  params?: Record<string, unknown>;
  /** POST body */
  body?: unknown;
  /** chain to send via x-chain header. Defaults to "solana". */
  chain?: BirdeyeChain;
  /** Override base URL (testing). */
  baseUrl?: string;
  /** Max retries on 5xx / network. Default 3. */
  retries?: number;
  /** AbortSignal */
  signal?: AbortSignal;
}

interface ClientConfig {
  apiKey: string;
  baseUrl: string;
  debug: boolean;
}

let cachedConfig: ClientConfig | null = null;

function getConfig(): ClientConfig {
  if (cachedConfig) return cachedConfig;
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BIRDEYE_API_KEY missing. Set it in .env or process.env before calling Birdeye client.",
    );
  }
  cachedConfig = {
    apiKey,
    baseUrl: process.env.BIRDEYE_BASE_URL ?? DEFAULT_BASE_URL,
    debug:
      process.env.BIRDEYE_DEBUG === "1" ||
      process.env.BIRDEYE_DEBUG === "true",
  };
  return cachedConfig;
}

/** Test-only — clear cached config (e.g. after env mutation). */
export function _resetBirdeyeConfigCache() {
  cachedConfig = null;
}

function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      // Birdeye uses comma-joined for lists in most endpoints
      usp.append(k, v.map((x) => String(x)).join(","));
    } else if (typeof v === "object") {
      usp.append(k, JSON.stringify(v));
    } else {
      usp.append(k, String(v));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

interface DebugLog {
  endpoint: string;
  method: string;
  chain: BirdeyeChain;
  status: number;
  durationMs: number;
  cuConsumed?: number;
  cuLeft?: number;
  retry?: number;
}

function log(entry: DebugLog) {
  const cfg = cachedConfig;
  if (!cfg?.debug) return;
  const cu =
    entry.cuConsumed != null
      ? ` cu=${entry.cuConsumed}${entry.cuLeft != null ? `/${entry.cuLeft}` : ""}`
      : "";
  const retry = entry.retry ? ` retry=${entry.retry}` : "";
  // eslint-disable-next-line no-console
  console.log(
    `[birdeye] ${entry.method} ${entry.endpoint} chain=${entry.chain} status=${entry.status} ${entry.durationMs}ms${cu}${retry}`,
  );
}

/**
 * Core call — does NOT export. Use `birdeyeGet` / `birdeyePost`.
 * - validates input against `input` schema
 * - sends with X-API-KEY + x-chain headers
 * - retries on 5xx / network up to `retries` (default 3) with expo backoff + jitter
 * - validates response envelope, returns parsed `data`
 */
async function call<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(opts: CallOpts<TInput, TOutput>): Promise<z.infer<TOutput>> {
  const cfg = getConfig();
  const chain = BirdeyeChainSchema.parse(opts.chain ?? DEFAULT_CHAIN);
  const baseUrl = opts.baseUrl ?? cfg.baseUrl;
  const retries = opts.retries ?? 3;

  // Validate input — supports either params (GET) or body (POST)
  if (opts.input) {
    const merged =
      opts.method === "GET" ? (opts.params ?? {}) : (opts.body ?? {});
    const parsed = opts.input.safeParse(merged);
    if (!parsed.success) {
      throw new BirdeyeError({
        message: `Invalid input for ${opts.path}: ${parsed.error.message}`,
        status: 0,
        endpoint: opts.path,
        chain,
        cause: parsed.error,
      });
    }
  }

  const url =
    baseUrl + opts.path + (opts.method === "GET" ? buildQuery(opts.params) : "");

  const headers: Record<string, string> = {
    "X-API-KEY": cfg.apiKey,
    "x-chain": chain,
    accept: "application/json",
  };
  if (opts.method === "POST") headers["content-type"] = "application/json";

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: opts.method,
        headers,
        body:
          opts.method === "POST" && opts.body !== undefined
            ? JSON.stringify(opts.body)
            : undefined,
        signal: opts.signal,
      });

      const durationMs = Math.round(performance.now() - start);
      const cuConsumed = numHeader(res.headers.get("x-credits-consumed"));
      const cuLeft = numHeader(res.headers.get("x-credits-left"));

      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        log({
          endpoint: opts.path,
          method: opts.method,
          chain,
          status: res.status,
          durationMs,
          cuConsumed,
          cuLeft,
          retry: attempt + 1,
        });
        await sleep(backoff(attempt), opts.signal);
        continue;
      }

      const text = await res.text();
      let json: unknown;
      try {
        json = text ? JSON.parse(text) : undefined;
      } catch {
        // non-JSON; keep raw text in error
      }

      log({
        endpoint: opts.path,
        method: opts.method,
        chain,
        status: res.status,
        durationMs,
        cuConsumed,
        cuLeft,
      });

      if (!res.ok) {
        throw new BirdeyeError({
          message: `Birdeye ${opts.method} ${opts.path} failed: ${res.status} ${res.statusText}`,
          status: res.status,
          endpoint: opts.path,
          chain,
          body: json ?? text,
        });
      }

      const envelope = z
        .object({
          success: z.boolean().optional(),
          data: z.unknown(),
          message: z.string().optional(),
        })
        .passthrough();
      const env = envelope.safeParse(json);
      if (!env.success) {
        throw new BirdeyeError({
          message: `Birdeye ${opts.path}: malformed envelope: ${env.error.message}`,
          status: res.status,
          endpoint: opts.path,
          chain,
          body: json,
          cause: env.error,
        });
      }
      if (env.data.success === false) {
        throw new BirdeyeError({
          message: `Birdeye ${opts.path}: success=false ${env.data.message ?? ""}`,
          status: res.status,
          endpoint: opts.path,
          chain,
          body: json,
        });
      }

      const dataParsed = opts.output.safeParse(env.data.data);
      if (!dataParsed.success) {
        throw new BirdeyeError({
          message: `Birdeye ${opts.path}: response failed schema validation: ${dataParsed.error.message}`,
          status: res.status,
          endpoint: opts.path,
          chain,
          body: env.data.data,
          cause: dataParsed.error,
        });
      }
      return dataParsed.data as z.infer<TOutput>;
    } catch (err) {
      lastErr = err;
      if (err instanceof BirdeyeError) throw err;
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        throw err;
      }
      if (attempt < retries) {
        log({
          endpoint: opts.path,
          method: opts.method,
          chain,
          status: 0,
          durationMs: Math.round(performance.now() - start),
          retry: attempt + 1,
        });
        await sleep(backoff(attempt), opts.signal);
        continue;
      }
    }
  }
  throw new BirdeyeError({
    message: `Birdeye ${opts.method} ${opts.path}: exhausted ${retries} retries`,
    status: 0,
    endpoint: opts.path,
    chain: BirdeyeChainSchema.parse(opts.chain ?? DEFAULT_CHAIN),
    cause: lastErr,
  });
}

function numHeader(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function backoff(attempt: number): number {
  // 250ms, 500ms, 1s, 2s ... + jitter
  const base = 250 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 100);
  return Math.min(base + jitter, 5_000);
}

/** Typed GET wrapper. */
export function birdeyeGet<TOutput extends z.ZodTypeAny>(
  path: string,
  opts: {
    output: TOutput;
    input?: z.ZodTypeAny;
    params?: Record<string, unknown>;
    chain?: BirdeyeChain;
    retries?: number;
    signal?: AbortSignal;
    baseUrl?: string;
  },
): Promise<z.infer<TOutput>> {
  return call({
    path,
    method: "GET",
    output: opts.output,
    input: opts.input,
    params: opts.params,
    chain: opts.chain,
    retries: opts.retries,
    signal: opts.signal,
    baseUrl: opts.baseUrl,
  });
}

/** Typed POST wrapper. */
export function birdeyePost<TOutput extends z.ZodTypeAny>(
  path: string,
  opts: {
    output: TOutput;
    input?: z.ZodTypeAny;
    body?: unknown;
    chain?: BirdeyeChain;
    retries?: number;
    signal?: AbortSignal;
    baseUrl?: string;
  },
): Promise<z.infer<TOutput>> {
  return call({
    path,
    method: "POST",
    output: opts.output,
    input: opts.input,
    body: opts.body,
    chain: opts.chain,
    retries: opts.retries,
    signal: opts.signal,
    baseUrl: opts.baseUrl,
  });
}
