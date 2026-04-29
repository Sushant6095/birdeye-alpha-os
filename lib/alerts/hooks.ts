"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AlertKind, AlertRule } from "./types";

export function useAlertRules() {
  const qc = useQueryClient();
  const list = useQuery<{ items: AlertRule[] }>({
    queryKey: ["alert-rules"],
    queryFn: async () => {
      const r = await fetch("/api/alerts");
      if (!r.ok) throw new Error(`alerts ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: async (input: {
      type: AlertKind;
      config: Record<string, unknown>;
      enabled?: boolean;
    }) => {
      const r = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) throw new Error(`create ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
    }) => {
      const r = await fetch(`/api/alerts/${input.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) throw new Error(`update ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`delete ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });

  return { list, create, update, remove };
}
