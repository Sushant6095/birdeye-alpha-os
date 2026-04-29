"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "./toast-host";

interface CreditsResponse {
  usedToday: number;
  creditsLeft: number | null;
}

const SOFT_LIMIT_RATIO = 0.85;

/**
 * Soft 429 / quota guard. Polls /api/credits and surfaces a single toast
 * when the configured budget is over 85% spent. Once-per-page-load — the
 * toast host de-dupes on title.
 */
export function RateLimitWatcher() {
  const fired = useRef(false);
  const { push } = useToast();
  const { data } = useQuery<CreditsResponse>({
    queryKey: ["credits-watch"],
    queryFn: async () => {
      const r = await fetch("/api/credits");
      if (!r.ok) throw new Error(`credits ${r.status}`);
      return r.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (fired.current || !data) return;
    const used = data.usedToday;
    const left = data.creditsLeft;
    if (left == null) return;
    const total = used + left;
    if (total <= 0) return;
    if (used / total >= SOFT_LIMIT_RATIO) {
      fired.current = true;
      push({
        title: "API limit approaching",
        body: `${used.toLocaleString()} / ${total.toLocaleString()} credits used today. Slowing down — cached responses preferred.`,
        tone: "warn",
      });
    }
  }, [data, push]);

  return null;
}
