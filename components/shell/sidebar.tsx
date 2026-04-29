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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
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
        href="/discover"
        className="flex items-center gap-2 px-4 h-14 border-b border-border"
      >
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <span className="font-semibold tracking-tight">AlphaOS</span>
      </Link>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 border-t border-border">
        v0.1 · Birdeye
      </div>
    </aside>
  );
}
