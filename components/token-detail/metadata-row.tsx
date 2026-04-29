import { Globe, Twitter, MessageCircle, FileText, Copy } from "lucide-react";
import type { TokenMeta, TokenOverview } from "./types";
import { shortAddr } from "@/lib/format";

const ICONS: Record<string, typeof Globe> = {
  website: Globe,
  twitter: Twitter,
  x: Twitter,
  telegram: MessageCircle,
  discord: MessageCircle,
  coingeckoId: FileText,
  whitepaper: FileText,
};

function urlFor(key: string, value: string): string {
  if (!value) return "#";
  if (value.startsWith("http")) return value;
  switch (key) {
    case "twitter":
    case "x":
      return `https://x.com/${value.replace(/^@/, "")}`;
    case "telegram":
      return `https://t.me/${value.replace(/^@/, "")}`;
    case "discord":
      return value.startsWith("http") ? value : `https://discord.gg/${value}`;
    case "coingeckoId":
      return `https://www.coingecko.com/en/coins/${value}`;
    default:
      return value;
  }
}

export function MetadataRow({
  meta,
  overview,
  address,
}: {
  meta: TokenMeta | null;
  overview: TokenOverview | null;
  address: string;
}) {
  const ext =
    meta?.extensions ??
    (overview?.extensions as Record<string, unknown> | undefined) ??
    {};
  const links = Object.entries(ext)
    .filter(([k, v]) => typeof v === "string" && v.length > 0 && k in ICONS)
    .map(([k, v]) => ({ key: k, value: v as string }));

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <code
        className="font-mono bg-secondary/40 rounded px-1.5 py-0.5 inline-flex items-center gap-1"
        title={address}
      >
        {shortAddr(address, 6, 6)}
        <CopyAddr address={address} />
      </code>
      {links.length > 0 && <span className="opacity-50">·</span>}
      {links.map(({ key, value }) => {
        const Icon = ICONS[key] ?? Globe;
        return (
          <a
            key={key}
            href={urlFor(key, value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
            title={value}
          >
            <Icon className="h-3.5 w-3.5" />
            {key}
          </a>
        );
      })}
    </div>
  );
}

function CopyAddr({ address }: { address: string }) {
  // Server-rendered shell; click handler added by client wrapper if needed.
  return (
    <button
      data-clip={address}
      className="text-muted-foreground hover:text-foreground"
      aria-label="copy address"
    >
      <Copy className="h-3 w-3" />
    </button>
  );
}
