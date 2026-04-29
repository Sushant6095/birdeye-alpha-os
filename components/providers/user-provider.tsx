"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "alphaos:user-id";

interface UserCtx {
  id: string;
  /** Convenience: returns headers to attach to every fetch. */
  headers: HeadersInit;
}

const Ctx = createContext<UserCtx | null>(null);

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000000";
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let v: string | null = null;
    try {
      v = window.localStorage.getItem(KEY);
    } catch {
      /* swallow */
    }
    if (!v) {
      v = uuid();
      try {
        window.localStorage.setItem(KEY, v);
      } catch {
        /* swallow */
      }
    }
    setId(v);
  }, []);

  // Patch fetch globally so every request carries the user header. Idempotent.
  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    const orig = window.fetch.bind(window);
    const patched: typeof window.fetch = (input, init) => {
      const headers = new Headers((init as RequestInit | undefined)?.headers ?? {});
      if (!headers.has("x-alphaos-user")) headers.set("x-alphaos-user", id);
      return orig(input, { ...(init as RequestInit | undefined), headers });
    };
    (patched as typeof patched & { __alphaos?: true }).__alphaos = true;
    if (!(window.fetch as typeof window.fetch & { __alphaos?: true }).__alphaos) {
      window.fetch = patched;
    }
    return () => {
      // restore the original on unmount of the provider tree
      window.fetch = orig;
    };
  }, [id]);

  const value = useMemo<UserCtx | null>(
    () =>
      id
        ? {
            id,
            headers: { "x-alphaos-user": id },
          }
        : null,
    [id],
  );
  if (!value) return <>{children}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns null until localStorage hydrates on the first client tick. */
export function useUser(): UserCtx | null {
  return useContext(Ctx);
}
