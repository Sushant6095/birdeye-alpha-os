import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { serve } from "@hono/node-server";
import { BirdeyeWsManager } from "./birdeye-ws.js";
import { parseTopic } from "./parse-topic.js";
import { TOPIC_KINDS } from "./topics.js";
import { log } from "./log.js";

const PORT = Number(process.env.PORT ?? 4001);
const API_KEY = process.env.BIRDEYE_API_KEY;
if (!API_KEY) {
  console.error("BIRDEYE_API_KEY missing — sidecar refusing to start.");
  process.exit(1);
}

const manager = new BirdeyeWsManager(API_KEY);
const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "OPTIONS"],
    credentials: false,
  }),
);

app.get("/", (c) =>
  c.json({
    name: "ws-sidecar",
    topics: TOPIC_KINDS,
    chains: manager.stats(),
  }),
);

app.get("/healthz", (c) => c.json({ ok: true, ts: Date.now() }));

app.get("/metrics", (c) =>
  c.json({ chains: manager.stats(), pid: process.pid, uptime: process.uptime() }),
);

/**
 * GET /sse/:topic?<params>&chain=solana
 *
 * Streams Birdeye events for the matching topic until the client disconnects.
 * Reference-counts upstream subscriptions: 100 SSE clients on the same topic
 * = 1 upstream subscription.
 */
app.get("/sse/:topic", async (c) => {
  const kind = c.req.param("topic");
  const query = c.req.query();
  const chain = query.chain ?? "solana";

  const parsed = parseTopic(kind, query);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    const id = crypto.randomUUID();
    let eventNum = 0;
    let alive = true;

    log.info("sse client connected", { id, chain, kind });
    await stream.writeSSE({
      event: "ready",
      data: JSON.stringify({ id, kind, chain }),
    });

    const unsubscribe = manager.subscribe(chain, parsed.topic, async (ev) => {
      if (!alive) return;
      try {
        eventNum += 1;
        await stream.writeSSE({
          id: String(eventNum),
          data: JSON.stringify(ev),
        });
      } catch (err) {
        log.warn("sse write failed", {
          id,
          err: (err as Error).message,
        });
      }
    });

    // SSE comment heartbeat every 25s to keep proxies from killing the conn
    const heartbeat = setInterval(() => {
      if (!alive) return;
      stream.writeSSE({ event: "ping", data: String(Date.now()) }).catch(() => {});
    }, 25_000);

    stream.onAbort(() => {
      alive = false;
      clearInterval(heartbeat);
      unsubscribe();
      log.info("sse client disconnected", { id, chain, kind });
    });

    // keep the handler alive until the client disconnects
    await new Promise<void>((resolve) => {
      stream.onAbort(() => resolve());
    });
  });
});

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  log.info(`ws-sidecar listening`, { port: info.port });
});

function shutdown(reason: string) {
  log.info("shutting down", { reason });
  manager.destroy();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  log.error("uncaughtException", { err: err.message, stack: err.stack });
});
process.on("unhandledRejection", (err) => {
  log.error("unhandledRejection", { err: String(err) });
});
