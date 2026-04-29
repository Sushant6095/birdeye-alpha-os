"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Buffer-and-flush hook designed for high-throughput streams.
 *
 * Each `push()` call appends to an off-state ring; we flush at most once per
 * animation frame regardless of how many pushes happened in between, which
 * keeps the renderer at one re-render per frame even at 100 events/sec.
 *
 * `cap` bounds how many items the visible state holds — older items drop off
 * the back so memory doesn't grow unbounded.
 */
export function useBatchedBuffer<T>(cap: number = 500): {
  items: T[];
  push: (next: T) => void;
  reset: () => void;
} {
  const [items, setItems] = useState<T[]>([]);
  const queue = useRef<T[]>([]);
  const scheduled = useRef(false);

  const flush = useCallback(() => {
    scheduled.current = false;
    const drained = queue.current;
    if (drained.length === 0) return;
    queue.current = [];
    setItems((prev) => {
      // newest first within the burst, then older items
      const merged = drained.slice().reverse().concat(prev);
      return merged.length > cap ? merged.slice(0, cap) : merged;
    });
  }, [cap]);

  const push = useCallback(
    (item: T) => {
      queue.current.push(item);
      if (scheduled.current) return;
      scheduled.current = true;
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        window.requestAnimationFrame(flush);
      } else {
        setTimeout(flush, 16);
      }
    },
    [flush],
  );

  const reset = useCallback(() => {
    queue.current = [];
    scheduled.current = false;
    setItems([]);
  }, []);

  useEffect(() => {
    return () => {
      queue.current = [];
      scheduled.current = false;
    };
  }, []);

  return { items, push, reset };
}
