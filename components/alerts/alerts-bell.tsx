"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fmtTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface HistoryRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  firedAt: string;
}

export function AlertsBell() {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery<{ items: HistoryRow[] }>({
    queryKey: ["alert-history-mini"],
    queryFn: async () => {
      const r = await fetch("/api/alerts/history");
      if (!r.ok) return { items: [] };
      return r.json();
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  const rows = data?.items ?? [];
  const unread =
    seenAt == null
      ? rows.length
      : rows.filter((r) => r.firedAt > seenAt).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && rows[0]) setSeenAt(rows[0].firedAt);
        }}
        className={cn(
          "h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-secondary/40 hover:bg-secondary relative",
        )}
        aria-label="alerts"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-400" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-80 rounded-md border border-border bg-background shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Alerts
            </span>
            <Link
              href="/settings/alerts/history"
              className="text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              full history →
            </Link>
          </div>
          <ul className="divide-y divide-border/40">
            {rows.slice(0, 12).map((r) => (
              <li key={r.id} className="px-3 py-2 text-xs">
                <p className="font-medium truncate">{r.title}</p>
                {r.body && (
                  <p className="text-muted-foreground line-clamp-2">{r.body}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fmtTimeAgo(new Date(r.firedAt).getTime() / 1000)} ago · {r.type}
                </p>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-3 py-3 text-xs text-muted-foreground">
                No alerts yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
