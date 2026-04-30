import { ChainBadge } from "./chain-badge";

interface Orbit {
  radius: number;
  rotateClass: string;
  counterClass: string;
  chains: string[];
  /** Initial angular offset (degrees) so rings don't all start at 3 o'clock. */
  startDeg: number;
}

const ORBITS: Orbit[] = [
  {
    radius: 110,
    rotateClass: "orb-r1",
    counterClass: "orb-r1-counter",
    startDeg: 0,
    chains: ["solana", "ethereum", "base"],
  },
  {
    radius: 180,
    rotateClass: "orb-r2",
    counterClass: "orb-r2-counter",
    startDeg: 30,
    chains: ["arbitrum", "polygon", "optimism", "bsc"],
  },
  {
    radius: 250,
    rotateClass: "orb-r3",
    counterClass: "orb-r3-counter",
    startDeg: 15,
    chains: ["avalanche", "sui", "zksync", "ethereum", "base"],
  },
];

export function Orb() {
  return (
    <div
      className="relative mx-auto"
      style={{ height: 600, width: 600 }}
    >
      {/* Ambient halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-mint) / 0.30) 0%, hsl(var(--brand-mint) / 0.08) 35%, transparent 65%)",
          filter: "blur(12px)",
        }}
      />

      {/* Orbit rings — purely visual, do NOT rotate so the line stays still */}
      {ORBITS.map((o, i) => (
        <div
          key={`ring-${i}`}
          aria-hidden
          className="absolute rounded-full"
          style={{
            top: "50%",
            left: "50%",
            width: o.radius * 2,
            height: o.radius * 2,
            transform: "translate(-50%, -50%)",
            border: `1px dashed hsl(var(--brand-mint) / ${0.22 - i * 0.04})`,
          }}
        />
      ))}

      {/* Orbiting chain badges — each ring rotates as a whole, badges
          counter-rotate at matching speed so logos stay upright. */}
      {ORBITS.map((orbit, ringIdx) => (
        <div
          key={`orbit-${ringIdx}`}
          className={`absolute inset-0 ${orbit.rotateClass}`}
          style={{
            transformOrigin: "center",
            // CSS transforms compose: ring is rotated by initial offset, then
            // the keyframe drives continuous rotation on top.
            // We use a wrapper so initial offset doesn't fight the keyframe.
          }}
        >
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${orbit.startDeg}deg)` }}
          >
            {orbit.chains.map((chain, idx) => {
              const angle = (idx / orbit.chains.length) * Math.PI * 2;
              const x = Math.cos(angle) * orbit.radius;
              const y = Math.sin(angle) * orbit.radius;
              return (
                <div
                  key={`${ringIdx}-${idx}-${chain}`}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
                  }}
                >
                  {/* Soft orbit-trail dot behind badge */}
                  <div
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, hsl(var(--brand-mint) / 0.55) 0%, transparent 70%)",
                      filter: "blur(8px)",
                      transform: "scale(2.2)",
                    }}
                  />
                  {/* Counter-rotation: keeps the chain logo upright */}
                  <div className={orbit.counterClass}>
                    <div className="float-y">
                      <ChainBadge
                        chain={chain}
                        size="lg"
                        className="ring-2 ring-white/10 shadow-[0_0_24px_-4px_hsl(var(--brand-mint)/0.6)]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sun — central α with pulsing glow */}
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--brand-mint) / 0.7) 0%, hsl(var(--brand-mint) / 0.25) 40%, transparent 70%)",
            filter: "blur(20px)",
            transform: "scale(2.4)",
          }}
        />
        <div
          className="sun-pulse relative flex h-24 w-24 items-center justify-center rounded-full glow-mint"
          style={{
            background:
              "radial-gradient(circle, hsl(222 30% 5%) 55%, hsl(var(--brand-mint) / 0.25) 100%)",
          }}
        >
          <span className="text-3xl font-black text-gradient-mint">α</span>
        </div>
      </div>
    </div>
  );
}
