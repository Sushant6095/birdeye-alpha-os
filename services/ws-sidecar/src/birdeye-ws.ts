import WebSocket from "ws";
import { log } from "./log.js";
import {
  buildSubscribeMessage,
  buildUnsubscribeMessage,
  eventKindFromMessage,
  eventMatchesTopic,
  topicKey,
  type TopicParams,
} from "./topics.js";

export type Chain = string; // free-form: solana, ethereum, base, …

const BASE = process.env.BIRDEYE_WS_URL ?? "wss://public-api.birdeye.so/socket";
const PROTOCOL = "echo-protocol";
const PING_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 30_000;

export type EventListener = (event: unknown) => void;

interface Subscription {
  topic: TopicParams;
  key: string;
  refCount: number;
  listeners: Set<EventListener>;
  /** last event we forwarded — useful for replaying to new subscribers. */
  lastEvent?: unknown;
}

/** One persistent WS connection per chain. Multiplexes subscriptions. */
class ChainConnection {
  private ws: WebSocket | null = null;
  private readonly chain: Chain;
  private readonly apiKey: string;
  private subs = new Map<string, Subscription>();
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempt = 0;
  private opening = false;
  private destroyed = false;

  constructor(chain: Chain, apiKey: string) {
    this.chain = chain;
    this.apiKey = apiKey;
  }

  /**
   * Increment ref-count for a topic. If first subscriber, send SUBSCRIBE
   * upstream (and open the WS if not already open). Returns an unsubscribe.
   */
  subscribe(topic: TopicParams, listener: EventListener): () => void {
    const key = topicKey(topic);
    let sub = this.subs.get(key);
    if (!sub) {
      sub = { topic, key, refCount: 0, listeners: new Set() };
      this.subs.set(key, sub);
    }
    sub.refCount++;
    sub.listeners.add(listener);

    if (sub.refCount === 1) {
      this.ensureOpen();
      this.sendSubscribe(sub);
    } else if (sub.lastEvent !== undefined) {
      // give late joiners the latest known value
      try {
        listener(sub.lastEvent);
      } catch {
        /* swallow */
      }
    }

    return () => this.unsubscribe(key, listener);
  }

  private unsubscribe(key: string, listener: EventListener): void {
    const sub = this.subs.get(key);
    if (!sub) return;
    sub.listeners.delete(listener);
    sub.refCount = Math.max(0, sub.refCount - 1);
    if (sub.refCount === 0) {
      this.sendUnsubscribe(sub);
      this.subs.delete(key);
      log.info("topic unref → unsubscribed upstream", {
        chain: this.chain,
        key,
      });
    }
    if (this.subs.size === 0 && this.ws) {
      log.info("no subscribers — closing chain ws", { chain: this.chain });
      this.closeWs();
    }
  }

  /** Close & destroy. Used on shutdown. */
  destroy() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.closeWs();
  }

  /* ---------------------- internal ---------------------- */

  private ensureOpen() {
    if (this.opening) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    this.opening = true;
    const url = `${BASE}/${encodeURIComponent(this.chain)}?x-api-key=${encodeURIComponent(this.apiKey)}`;
    log.info("opening upstream ws", { chain: this.chain });
    const ws = new WebSocket(url, [PROTOCOL], {
      headers: {
        Origin: "ws://public-api.birdeye.so",
        "Sec-WebSocket-Origin": "ws://public-api.birdeye.so",
      },
    });
    this.ws = ws;

    ws.on("open", () => {
      this.opening = false;
      this.reconnectAttempt = 0;
      log.info("upstream ws open", { chain: this.chain });
      // Re-subscribe everything (covers reconnects)
      for (const sub of this.subs.values()) this.sendSubscribe(sub);
      this.startPing();
    });

    ws.on("message", (raw) => this.onMessage(raw));

    ws.on("close", (code, reason) => {
      log.warn("upstream ws closed", {
        chain: this.chain,
        code,
        reason: reason.toString(),
      });
      this.stopPing();
      this.opening = false;
      this.ws = null;
      if (!this.destroyed && this.subs.size > 0) this.scheduleReconnect();
    });

    ws.on("error", (err) => {
      log.error("upstream ws error", {
        chain: this.chain,
        err: err.message,
      });
    });

    ws.on("pong", () => {
      log.debug("upstream pong", { chain: this.chain });
    });
  }

  private sendSubscribe(sub: Subscription) {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const msg = buildSubscribeMessage(sub.topic);
    log.info("→ SUBSCRIBE", { chain: this.chain, key: sub.key });
    ws.send(JSON.stringify(msg));
  }

  private sendUnsubscribe(sub: Subscription) {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const msg = buildUnsubscribeMessage(sub.topic);
    ws.send(JSON.stringify(msg));
  }

  private onMessage(raw: WebSocket.RawData) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      log.warn("non-json frame from upstream", { chain: this.chain });
      return;
    }
    const kind = eventKindFromMessage(parsed);
    if (!kind) {
      log.debug("upstream unknown frame", {
        chain: this.chain,
        type: (parsed as { type?: string })?.type,
      });
      return;
    }
    let routed = 0;
    for (const sub of this.subs.values()) {
      if (sub.topic.kind !== kind) continue;
      if (!eventMatchesTopic(parsed, sub.topic)) continue;
      sub.lastEvent = parsed;
      for (const listener of sub.listeners) {
        try {
          listener(parsed);
        } catch (err) {
          log.error("listener threw", {
            err: (err as Error).message,
            key: sub.key,
          });
        }
      }
      routed++;
    }
    log.debug("event routed", {
      chain: this.chain,
      kind,
      subs: routed,
    });
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      const ws = this.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      try {
        ws.ping();
      } catch (err) {
        log.warn("ping failed", { err: (err as Error).message });
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(
      MAX_BACKOFF_MS,
      500 * 2 ** this.reconnectAttempt,
    ) + Math.floor(Math.random() * 250);
    this.reconnectAttempt++;
    log.info("reconnect scheduled", {
      chain: this.chain,
      attempt: this.reconnectAttempt,
      delay,
    });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureOpen();
    }, delay);
  }

  private closeWs() {
    this.stopPing();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* swallow */
      }
      this.ws = null;
    }
  }

  /** Stats for /metrics. */
  stats() {
    return {
      chain: this.chain,
      open: this.ws?.readyState === WebSocket.OPEN,
      subs: this.subs.size,
      totalRefs: [...this.subs.values()].reduce((n, s) => n + s.refCount, 0),
      reconnectAttempt: this.reconnectAttempt,
    };
  }
}

/** Top-level manager: one ChainConnection per chain. */
export class BirdeyeWsManager {
  private connections = new Map<Chain, ChainConnection>();
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  subscribe(
    chain: Chain,
    topic: TopicParams,
    listener: EventListener,
  ): () => void {
    let conn = this.connections.get(chain);
    if (!conn) {
      conn = new ChainConnection(chain, this.apiKey);
      this.connections.set(chain, conn);
    }
    return conn.subscribe(topic, listener);
  }

  destroy() {
    for (const c of this.connections.values()) c.destroy();
    this.connections.clear();
  }

  stats() {
    return [...this.connections.values()].map((c) => c.stats());
  }
}
