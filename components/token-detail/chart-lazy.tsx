"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Defer the lightweight-charts bundle until the chart actually mounts.
 * Saves ~50 KB of First Load JS on the Token Lens initial paint and
 * lets the SSR header + stats panel render before the chart code lands.
 */
export const TokenChart = dynamic(
  () => import("./chart").then((m) => ({ default: m.TokenChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] rounded-md" />,
  },
);
