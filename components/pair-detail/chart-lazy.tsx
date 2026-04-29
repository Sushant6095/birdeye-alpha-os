"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const PairChart = dynamic(
  () => import("./chart").then((m) => ({ default: m.PairChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] rounded-md" />,
  },
);
