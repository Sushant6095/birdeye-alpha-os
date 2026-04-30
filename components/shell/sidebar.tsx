"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Activity,
  Eye,
  Rocket,
  GitCompare,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/tape", label: "Trade Tape", icon: Activity },
  { href: "/whales", label: "Whale Radar", icon: Eye },
  { href: "/memes", label: "Memes", icon: Rocket },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex h-screen w-56 shrink-0 flex-col border-r border-border bg-background sticky top-0">
      <Link
        href="/"
        className="flex items-center gap-2 px-4 h-14 border-b border-border group"
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md transition-shadow group-hover:glow-mint-sm"
          style={{ background: "hsl(220 13% 5%)" }}
        >
          <span className="text-sm font-black text-gradient-mint">α</span>
        </div>
        <span className="font-semibold tracking-tight">AlphaOS</span>
      </Link>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + "/") || pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group/nav relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
                active
                  ? "bg-emerald-400/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400 shadow-[0_0_12px_2px_hsl(var(--brand-mint))]" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-emerald-400" : "text-muted-foreground group-hover/nav:text-foreground",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 border-t border-border">
        <span className="text-emerald-400/80">●</span> v0.1 · Birdeye
      </div>
    </aside>
  );
}
