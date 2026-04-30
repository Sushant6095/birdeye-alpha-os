/**
 * Structured server-side logger.
 *
 * - Always emits warn / error
 * - Emits info only when LOG_LEVEL >= info (default)
 * - Emits debug only when LOG_LEVEL=debug or BIRDEYE_DEBUG=1
 *
 * Each line is a single JSON record so it's grep-friendly in Vercel logs.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): Level {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

function debugForced(): boolean {
  return (
    process.env.BIRDEYE_DEBUG === "1" ||
    process.env.BIRDEYE_DEBUG === "true" ||
    process.env.CACHE_DEBUG === "1" ||
    process.env.CACHE_DEBUG === "true"
  );
}

function shouldEmit(level: Level): boolean {
  if (level === "debug" && debugForced()) return true;
  return LEVEL_RANK[level] >= LEVEL_RANK[configuredLevel()];
}

function fmt(scope: string, level: Level, msg: string, fields?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const head = `${ts} ${level.toUpperCase().padEnd(5)} [${scope}] ${msg}`;
  if (!fields || Object.keys(fields).length === 0) return head;
  // Inline single-line key=value for readability, then JSON for full body in debug.
  const kv = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (v instanceof Error) return `${k}="${v.message}"`;
      if (typeof v === "string") return `${k}="${v}"`;
      if (typeof v === "object" && v !== null) {
        try {
          return `${k}=${JSON.stringify(v)}`;
        } catch {
          return `${k}=[unserializable]`;
        }
      }
      return `${k}=${String(v)}`;
    })
    .join(" ");
  return `${head} ${kv}`;
}

export function makeLogger(scope: string) {
  return {
    debug(msg: string, fields?: Record<string, unknown>) {
      if (!shouldEmit("debug")) return;
      console.log(fmt(scope, "debug", msg, fields));
    },
    info(msg: string, fields?: Record<string, unknown>) {
      if (!shouldEmit("info")) return;
      console.log(fmt(scope, "info", msg, fields));
    },
    warn(msg: string, fields?: Record<string, unknown>) {
      if (!shouldEmit("warn")) return;
      console.warn(fmt(scope, "warn", msg, fields));
    },
    error(msg: string, fields?: Record<string, unknown>) {
      if (!shouldEmit("error")) return;
      console.error(fmt(scope, "error", msg, fields));
    },
    /** Time an async operation, log info on success, error on throw. */
    async time<T>(
      msg: string,
      fn: () => Promise<T>,
      fields?: Record<string, unknown>,
    ): Promise<T> {
      const t0 = performance.now();
      try {
        const r = await fn();
        this.info(msg, { ...fields, ms: Math.round(performance.now() - t0), ok: true });
        return r;
      } catch (err) {
        this.error(msg, {
          ...fields,
          ms: Math.round(performance.now() - t0),
          ok: false,
          err: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
  };
}

export type Logger = ReturnType<typeof makeLogger>;
