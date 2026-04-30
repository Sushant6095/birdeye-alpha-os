import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Eye,
  Sparkles,
  Compass,
  Rocket,
  GitCompare,
  Wallet,
  Bot,
  Zap,
  ShieldCheck,
  Layers,
  Database,
} from "lucide-react";
import { Orb } from "@/components/landing/orb";
import { ChainBadge } from "@/components/landing/chain-badge";

const CHAINS = [
  "solana", "ethereum", "base", "arbitrum", "optimism",
  "polygon", "avalanche", "bsc", "zksync", "sui",
];

const FEATURES = [
  {
    icon: Compass,
    title: "Discover",
    desc: "7 live feeds — trending, new listings, gainers/losers, smart money, memes, by DEX.",
    href: "/discover",
  },
  {
    icon: Activity,
    title: "Token & Pair Lens",
    desc: "Eight-call SSR header, lazy candles, live price ticks, holders, security, top traders.",
    href: "/discover",
  },
  {
    icon: Wallet,
    title: "Wallet Profiler",
    desc: "Verdict label + holdings, PnL, transactions, transfers, origin — in one screen.",
    href: "/discover",
  },
  {
    icon: Eye,
    title: "Whale Radar",
    desc: "Large-trade WebSocket with watchlist, sound, Telegram, and AI auto-verdict per whale.",
    href: "/whales",
  },
  {
    icon: GitCompare,
    title: "Compare",
    desc: "Matrix · radar · correlation · holder & top-trader overlap across multiple tokens.",
    href: "/compare",
  },
  {
    icon: Rocket,
    title: "Memescope",
    desc: "Live meme-stat overlay on every row. Sortable. WebSocket-driven.",
    href: "/memes",
  },
  {
    icon: Bot,
    title: "AI Co-pilot",
    desc: "Frontier model with all 79 endpoints registered as tools. Streams charts inline.",
    href: "/discover",
  },
  {
    icon: Zap,
    title: "Alerts Engine",
    desc: "Five rule types — wallet, listing, pair, whale, threshold. Toasts + Telegram.",
    href: "/settings/alerts",
  },
];

const STATS = [
  { v: "79/79", k: "REST endpoints" },
  { v: "9/9", k: "WebSocket topics" },
  { v: "11", k: "user surfaces" },
  { v: "10", k: "chains supported" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md glow-mint-sm"
              style={{ background: "hsl(220 13% 5%)" }}
            >
              <span className="text-sm font-black text-gradient-mint">α</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">AlphaOS</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {([
              { label: "Discover", href: "/discover" },
              { label: "Tape", href: "/tape" },
              { label: "Whales", href: "/whales" },
              { label: "Memes", href: "/memes" },
              { label: "Compare", href: "/compare" },
            ] as const).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="hidden h-9 items-center justify-center rounded-md px-3 text-sm btn-ghost sm:inline-flex"
            >
              Open Terminal
            </Link>
            <Link
              href="/discover"
              className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium btn-mint"
            >
              Launch
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pt-16 pb-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-muted-foreground">
                Live on 10 chains · 79 endpoints · 9 WebSocket streams
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              The Bloomberg
              <br />
              Terminal for
              <br />
              <span className="text-gradient-mint">onchain markets.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              Every Birdeye REST endpoint and WebSocket stream wired into one
              keyboard-first terminal — plus an AI co-pilot that can call all
              of them mid-conversation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/discover"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold btn-mint"
              >
                Open Terminal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/whales"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold btn-ghost"
              >
                <Eye className="h-4 w-4" /> Watch Whales Live
              </Link>
            </div>

            <div className="mt-10">
              <div className="text-[11px] uppercase tracking-[.2em] text-muted-foreground/70">
                Supported chains
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {CHAINS.map((c) => (
                  <Link
                    key={c}
                    href={`/discover?chain=${c}`}
                    className="group flex items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs surface-hover"
                  >
                    <ChainBadge chain={c} size="sm" />
                    <span className="capitalize text-muted-foreground group-hover:text-foreground">
                      {c}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center fade-in-up stagger-2">
            <Orb />
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.k}
              className="flex flex-col items-start gap-1 bg-background/50 p-6"
            >
              <div className="font-mono text-3xl font-bold text-gradient-mint md:text-4xl">
                {s.v}
              </div>
              <div className="text-[11px] uppercase tracking-[.18em] text-muted-foreground">
                {s.k}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[.2em] text-emerald-400/80">
            Surfaces
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            Eleven dashboards.
            <br />
            <span className="text-gradient-mint">One keyboard.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every screen is composed from the same cached, credit-aware
            Birdeye client. Every screen is also a tool the AI agent can
            call.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Link
              key={f.title}
              href={f.href}
              className={`group surface surface-hover relative flex flex-col gap-3 rounded-xl p-5 fade-in-up stagger-${(i % 5) + 1}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/40 transition-colors group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10">
                <f.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-base font-semibold">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
              <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-7xl gap-px bg-border/60 md:grid-cols-3">
          {[
            {
              icon: Database,
              title: "Cached at every hop",
              desc: "Redis ➜ Postgres fallback ➜ Birdeye. Per-category TTL from 3s (price) to 24h (metadata).",
            },
            {
              icon: Layers,
              title: "Reference-counted streams",
              desc: "100 tabs watching BONK = 1 upstream WebSocket. The sidecar fans out to browsers via SSE.",
            },
            {
              icon: ShieldCheck,
              title: "Type-safe, end-to-end",
              desc: "Every endpoint validated by zod input + output. TypeScript strict, noUncheckedIndexedAccess.",
            },
          ].map((b) => (
            <div key={b.title} className="bg-background p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/40">
                <b.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-4 text-lg font-semibold">{b.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto my-24 max-w-7xl px-6">
        <div className="surface relative overflow-hidden rounded-2xl p-8 md:p-12">
          <div aria-hidden className="absolute inset-0 grid-bg-soft opacity-30" />
          <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI Co-pilot
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                "Should I take BONK now?"
                <br />
                <span className="text-muted-foreground">
                  — Agent picks 6 tools out of 79.
                </span>
              </h3>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Pulls trades, holders, security, top-traders, OHLCV. Streams a
                verdict, an inline chart, holder card, and top-trader list —
                all through custom tags rendered as React components.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/discover"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold btn-mint"
                >
                  Try the agent <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {[
                { kind: "tool", text: "getTokenOverview(BONK)" },
                { kind: "tool", text: "getHolderDistribution(BONK)" },
                { kind: "tool", text: "getTopTraders(BONK, limit=10)" },
                { kind: "tool", text: "getOhlcvV3(BONK, type=1h)" },
                { kind: "tag", text: "<verdict label='Cautious Buy' confidence='0.71'/>" },
                { kind: "tag", text: "<chart token='BONK' frame='1h'/>" },
                { kind: "tag", text: "<holders token='BONK'/>" },
              ].map((line, i) => (
                <div
                  key={i}
                  className={`fade-in-up stagger-${(i % 5) + 1} flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2`}
                >
                  <span
                    className={
                      line.kind === "tool"
                        ? "rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-400/30"
                        : "rounded px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-300 bg-fuchsia-400/10 ring-1 ring-fuchsia-400/30"
                    }
                  >
                    {line.kind === "tool" ? "TOOL" : "TAG"}
                  </span>
                  <span className="truncate text-muted-foreground">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Open the terminal.
        </h2>
        <p className="mt-3 text-muted-foreground">
          No signup. Hits Birdeye through a credit-aware cache, so every page
          is fast even on the free tier.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/discover"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold btn-mint"
          >
            Launch AlphaOS <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/Sushant6095/birdeye-alpha-os"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-semibold btn-ghost"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="text-xs text-muted-foreground">
            Built end-to-end on{" "}
            <a
              href="https://bds.birdeye.so"
              className="text-emerald-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Birdeye Data Services
            </a>
            . MIT licensed.
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/discover" className="hover:text-foreground">Discover</Link>
            <Link href="/tape" className="hover:text-foreground">Tape</Link>
            <Link href="/whales" className="hover:text-foreground">Whales</Link>
            <Link href="/memes" className="hover:text-foreground">Memes</Link>
            <Link href="/compare" className="hover:text-foreground">Compare</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
