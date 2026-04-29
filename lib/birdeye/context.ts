import { AsyncLocalStorage } from "node:async_hooks";

export interface BirdeyeRequestContext {
  /** UUID of the user the call is being made for; undefined for system-level calls. */
  userId?: string;
}

const storage = new AsyncLocalStorage<BirdeyeRequestContext>();

/** Run `fn` with the given Birdeye request context (e.g. `userId`). */
export function runWithBirdeyeContext<T>(
  ctx: BirdeyeRequestContext,
  fn: () => T,
): T {
  return storage.run(ctx, fn);
}

export function getBirdeyeContext(): BirdeyeRequestContext | undefined {
  return storage.getStore();
}
