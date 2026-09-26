import type { CSSProperties } from "react";

/**
 * The backdrop is a row of twelve glass tiles, each half a curtain pitch wide.
 * Behind them sit a few soft round lights that the glass diffuses, while the
 * middle stays white. Each light is centred at `x` (percent of the hero width)
 * and `y`, is `size` across — both in reference-frame pixels — and peaks at
 * opacity `a`.
 */
const TILE_COUNT = 12;
const LIGHTS = [
  { x: 20.8, y: 330, size: 620, a: 0.62 },
  { x: 79.2, y: 460, size: 580, a: 0.6 },
];

export function HeroTiles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      {LIGHTS.map((light) => (
        <span
          key={light.x}
          className="absolute top-[calc(var(--light-y)*var(--k)_+_50px)] left-(--light-x) aspect-square w-[calc(var(--light-size)*var(--k))] -translate-1/2 rounded-full bg-[radial-gradient(circle_closest-side,rgb(108_92_242/var(--light-a))_0%,rgb(128_114_246/calc(var(--light-a)*0.55))_45%,rgb(150_140_250/0)_100%)] blur-[calc(28*var(--k))] max-md:opacity-70"
          style={
            {
              "--light-x": `${light.x}%`,
              "--light-y": light.y,
              "--light-size": light.size,
              "--light-a": light.a,
            } as CSSProperties
          }
        />
      ))}
      <div className="absolute inset-0 grid grid-cols-12">
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          /* Each tile is a pane of glass (Figma: light -45° at 20%, depth
             52.57, frost 2.1). CSS can't bend the backdrop, so refraction is
             suggested by a depth bevel and dispersion by edge fringes. */
          <span
            key={i}
            className="relative bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_55%),linear-gradient(90deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0)_calc(52.57*var(--k)),rgba(255,255,255,0)_calc(100%_-_52.57*var(--k)),rgba(92,80,196,0.06)_100%)] shadow-glass backdrop-blur-[calc(2.1*var(--k))] backdrop-saturate-[1.15]"
          />
        ))}
      </div>
    </div>
  );
}
