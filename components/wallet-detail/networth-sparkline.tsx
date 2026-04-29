"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkline } from "@/components/ui/sparkline";

interface ChartResponse {
  data: { items?: Array<{ unixTime?: number; value?: number }> };
  unavailable?: boolean;
}

export function NetWorthSparkline({
  chain,
  wallet,
  fallbackValue,
}: {
  chain: string;
  wallet: string;
  /** Drawn flat if the chart endpoint isn't available. */
  fallbackValue?: number | null;
}) {
  const { data, isLoading } = useQuery<ChartResponse>({
    queryKey: ["networth-chart", chain, wallet],
    queryFn: async () => {
      const r = await fetch(
        `/api/wallet/networth-chart?chain=${chain}&wallet=${wallet}`,
      );
      if (!r.ok) throw new Error(`networth-chart ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60_000,
  });

  const items = data?.data?.items ?? [];
  const series = items
    .map((p) => Number(p.value))
    .filter((v) => Number.isFinite(v));

  if (isLoading) {
    return <div className="h-[36px] w-32 bg-secondary/40 animate-pulse rounded" />;
  }

  if (data?.unavailable || series.length < 2) {
    if (fallbackValue == null) {
      return (
        <span className="text-[10px] text-muted-foreground">no history</span>
      );
    }
    // flat line so the layout doesn't shift
    return (
      <div className="text-[10px] text-muted-foreground inline-flex items-center gap-2">
        <Sparkline values={[fallbackValue, fallbackValue]} width={120} height={36} />
        <span>flat — no chart endpoint</span>
      </div>
    );
  }

  return <Sparkline values={series} width={120} height={36} />;
}
