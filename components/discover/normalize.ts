import type { TokenLike } from "@/components/token/token-card";

/** Walk a Birdeye discover-route payload and pull a token list off it. */
export function tokensFromPayload(payload: unknown): TokenLike[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data ?? payload;
  if (!data || typeof data !== "object") return [];
  const candidates = [
    (data as { items?: unknown }).items,
    (data as { tokens?: unknown }).tokens,
    (data as { data?: unknown }).data,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as TokenLike[];
  }
  return [];
}

export function nextCursorFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const data = (payload as { data?: unknown }).data ?? payload;
  if (!data || typeof data !== "object") return undefined;
  const c =
    (data as { next_cursor?: unknown }).next_cursor ??
    (data as { nextCursor?: unknown }).nextCursor;
  return typeof c === "string" && c.length > 0 ? c : undefined;
}
