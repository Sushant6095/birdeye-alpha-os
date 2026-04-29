"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyAddress({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* swallow */
        }
      }}
      title="copy address"
    >
      {done ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
