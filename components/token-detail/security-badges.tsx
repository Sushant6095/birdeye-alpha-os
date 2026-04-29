import { ShieldCheck, AlertTriangle, ShieldAlert, Lock, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TokenSecurity } from "./types";

type Tone = "success" | "warn" | "danger";

interface BadgeSpec {
  label: string;
  detail?: string;
  tone: Tone;
  icon: typeof ShieldCheck;
}

function deriveBadges(s: TokenSecurity | null): BadgeSpec[] {
  if (!s) return [];
  const out: BadgeSpec[] = [];

  if (s.mintAuthority === null || s.mintAuthority === "") {
    out.push({
      label: "Mint renounced",
      tone: "success",
      icon: ShieldCheck,
    });
  } else if (s.mintAuthority) {
    out.push({
      label: "Mintable",
      detail: `mint auth: ${shrt(s.mintAuthority)}`,
      tone: "danger",
      icon: ShieldAlert,
    });
  }

  if (s.freezeAuthority === null || s.freezeAuthority === "") {
    out.push({
      label: "No freeze",
      tone: "success",
      icon: ShieldCheck,
    });
  } else if (s.freezeAuthority) {
    out.push({
      label: "Freezable",
      detail: `freeze auth: ${shrt(s.freezeAuthority)}`,
      tone: "warn",
      icon: Snowflake,
    });
  }

  if (s.transferFeeEnable) {
    out.push({
      label: "Transfer fee",
      tone: "warn",
      icon: AlertTriangle,
    });
  }

  if (s.ownerAddress == null) {
    out.push({
      label: "Owner renounced",
      tone: "success",
      icon: ShieldCheck,
    });
  } else if (s.ownerPercentage != null && s.ownerPercentage > 0) {
    const pct = s.ownerPercentage;
    out.push({
      label: `Owner ${pct.toFixed(1)}%`,
      tone: pct > 5 ? "danger" : "warn",
      icon: ShieldAlert,
    });
  }

  if (typeof s.top10HolderPercent === "number") {
    const pct = s.top10HolderPercent;
    const tone: Tone = pct > 30 ? "danger" : pct > 15 ? "warn" : "success";
    out.push({
      label: `Top10 ${pct.toFixed(1)}%`,
      tone,
      icon: pct > 30 ? AlertTriangle : ShieldCheck,
    });
  }

  // Liquidity locked is not directly exposed by the security endpoint we cover;
  // surface a placeholder so the row is visually balanced. Safe default = warn.
  out.push({
    label: "Liquidity lock unknown",
    tone: "warn",
    icon: Lock,
  });

  return out;
}

function shrt(a: string): string {
  if (a.length <= 8) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function SecurityBadges({ security }: { security: TokenSecurity | null }) {
  const badges = deriveBadges(security);
  if (badges.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Security data unavailable
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => {
        const Icon = b.icon;
        return (
          <Badge
            key={i}
            variant={b.tone}
            className="gap-1 px-1.5 py-0.5"
            title={b.detail}
          >
            <Icon className="h-3 w-3" />
            {b.label}
          </Badge>
        );
      })}
    </div>
  );
}
