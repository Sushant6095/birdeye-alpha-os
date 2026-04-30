import { ChainBadge } from "./chain-badge";

const ORBITS = [
  {
    radius: 110,
    duration: "orb-rotate",
    chains: ["ethereum", "solana", "base"],
  },
  {
    radius: 175,
    duration: "orb-rotate-rev",
    chains: ["arbitrum", "polygon", "optimism", "bsc"],
  },
  {
    radius: 245,
    duration: "orb-rotate",
    chains: ["avalanche", "sui", "zksync", "ethereum", "base"],
  },
];

export function Orb() {
  return (
    <div className="relative h-[560px] w-[560px] mx-auto">
      <div className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-mint) / 0.45) 0%, hsl(var(--brand-mint) / 0.18) 28%, transparent 60%)",
          filter: "blur(8px)",
        }}
      />
      <div className="absolute inset-12 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(220 13% 4%) 28%, hsl(var(--brand-mint) / 0.3) 36%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full ring-1"
        style={{
          width: 220, height: 220, top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          boxShadow:
            "inset 0 0 60px hsl(var(--brand-mint) / 0.5), 0 0 60px hsl(var(--brand-mint) / 0.3)",
          background:
            "radial-gradient(circle, hsl(220 13% 6%) 60%, hsl(var(--brand-mint) / 0.25) 100%)",
        }}
      />

      {ORBITS.map((orbit, i) => (
        <div
          key={i}
          className={`absolute inset-0 ${orbit.duration}`}
          style={{ transformOrigin: "center" }}
        >
          <div
            className="absolute rounded-full border border-white/10"
            style={{
              width: orbit.radius * 2,
              height: orbit.radius * 2,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              borderColor: `hsl(var(--brand-mint) / ${0.18 - i * 0.04})`,
            }}
          />
          {orbit.chains.map((chain, idx) => {
            const angle = (idx / orbit.chains.length) * Math.PI * 2;
            const x = Math.cos(angle) * orbit.radius;
            const y = Math.sin(angle) * orbit.radius;
            return (
              <div
                key={`${i}-${idx}-${chain}`}
                className="absolute float-y"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                  animationDelay: `${(idx * 0.3).toFixed(2)}s`,
                }}
              >
                <ChainBadge chain={chain} size="md" />
              </div>
            );
          })}
        </div>
      ))}

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full glow-mint"
          style={{ background: "hsl(220 13% 5%)" }}>
          <span className="text-2xl font-black text-gradient-mint">α</span>
        </div>
      </div>
    </div>
  );
}
