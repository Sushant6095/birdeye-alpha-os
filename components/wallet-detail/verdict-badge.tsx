import { Badge } from "@/components/ui/badge";
import {
  toneFor,
  type WalletVerdict,
} from "@/lib/verdict/wallet";

export function VerdictBadge({ verdict }: { verdict: WalletVerdict }) {
  const tone = toneFor(verdict.label);
  const variant =
    tone === "secondary" ? "outline" : (tone as "success" | "warn" | "danger");
  return (
    <div
      className="inline-flex flex-col gap-1"
      title={verdict.reasons.join(" · ")}
    >
      <Badge variant={variant} className="text-xs px-2 py-0.5 gap-1">
        {verdict.label}
        <span className="text-[10px] opacity-70">
          · {(verdict.confidence * 100).toFixed(0)}%
        </span>
      </Badge>
      {verdict.reasons.length > 0 && (
        <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-xs">
          {verdict.reasons.slice(0, 2).join(" · ")}
        </span>
      )}
    </div>
  );
}
