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
    <div className="hero-tiles" aria-hidden="true">
      {LIGHTS.map((light) => (
        <span
          key={light.x}
          className="hero-light"
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
      <div className="hero-tiles-grid">
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <span key={i} className="hero-tile" />
        ))}
      </div>
    </div>
  );
}
