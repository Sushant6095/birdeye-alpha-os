const LEVEL = process.env.LOG_LEVEL ?? "info";

const order = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type Level = keyof typeof order;

function fmt(level: Level, msg: string, ctx?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const tail = ctx ? " " + JSON.stringify(ctx) : "";
  return `${ts} ${level.toUpperCase()} ${msg}${tail}`;
}

function active(level: Level): boolean {
  return order[level] <= order[(LEVEL as Level) ?? "info"];
}

export const log = {
  error(msg: string, ctx?: Record<string, unknown>) {
    if (active("error")) console.error(fmt("error", msg, ctx));
  },
  warn(msg: string, ctx?: Record<string, unknown>) {
    if (active("warn")) console.warn(fmt("warn", msg, ctx));
  },
  info(msg: string, ctx?: Record<string, unknown>) {
    if (active("info")) console.log(fmt("info", msg, ctx));
  },
  debug(msg: string, ctx?: Record<string, unknown>) {
    if (active("debug")) console.log(fmt("debug", msg, ctx));
  },
};
