import Link from "next/link";
import { AlertTriangle, ArrowRight, Compass } from "lucide-react";

interface Props {
  title: string;
  message: string;
  hint?: string;
  detail?: string;
  primaryHref?: string;
  primaryLabel?: string;
}

/**
 * Full-page friendly error block. Used by SSR pages when an URL is
 * structurally invalid (chain ↔ address mismatch, missing token, etc.).
 */
export function ErrorState({
  title,
  message,
  hint,
  detail,
  primaryHref = "/discover",
  primaryLabel = "Back to Discover",
}: Props) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {hint && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-300">
          <span className="font-semibold uppercase tracking-wider">Try this</span>
          <span className="text-sky-100">{hint}</span>
        </div>
      )}
      {detail && (
        <pre className="mt-6 max-w-md overflow-x-auto rounded-md border border-border bg-secondary/40 p-3 text-left font-mono text-[11px] text-muted-foreground">
          {detail}
        </pre>
      )}
      <div className="mt-8 flex gap-3">
        <Link
          href={primaryHref}
          className="inline-flex h-10 items-center gap-2 rounded-md px-5 text-sm font-semibold btn-mint"
        >
          <Compass className="h-4 w-4" /> {primaryLabel}
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-md px-5 text-sm font-semibold btn-ghost"
        >
          Home <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
