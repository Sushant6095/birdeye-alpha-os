"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone?: "default" | "warn" | "danger" | "success";
  /** Optional click target (e.g., /token/[chain]/[address]). */
  href?: string;
  ts: number;
}

interface ToastApi {
  push: (t: Omit<Toast, "id" | "ts">) => void;
}

const Ctx = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 8_000;

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id" | "ts">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [{ ...t, id, ts: Date.now() }, ...prev].slice(0, MAX_VISIBLE));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed top-16 right-4 z-50 flex flex-col gap-2 w-[min(360px,90vw)]">
        {toasts.map((t) => (
          <a
            key={t.id}
            href={t.href ?? "#"}
            onClick={(e) => {
              if (!t.href) e.preventDefault();
              dismiss(t.id);
            }}
            className={cn(
              "pointer-events-auto rounded-md border bg-background/95 backdrop-blur shadow-lg p-3 flex items-start gap-3 transition-colors",
              t.tone === "warn" && "border-amber-500/40",
              t.tone === "danger" && "border-red-500/40",
              t.tone === "success" && "border-emerald-500/40",
            )}
          >
            <Bell
              className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                t.tone === "warn" && "text-amber-400",
                t.tone === "danger" && "text-red-400",
                t.tone === "success" && "text-emerald-400",
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              {t.body && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {t.body}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dismiss(t.id);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </a>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  return v ?? { push: () => {} };
}
