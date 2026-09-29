"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/**
 * A third light behind the glass tiles, carried by the pointer: it trails
 * the cursor across the hero, so the panes catch it as it passes and the
 * curtain covers it where they meet. Only for a fine pointer that can hover,
 * and never under reduced motion; it goes out when the pointer leaves.
 */
export function PointerLight() {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const light = ref.current;
    const hero = light?.closest("section");
    if (!light || !hero) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const toX = gsap.quickTo(light, "x", { duration: 1.2, ease: "power3.out" });
        const toY = gsap.quickTo(light, "y", { duration: 1.2, ease: "power3.out" });
        let lit = false;

        const move = (event: PointerEvent) => {
          const box = hero.getBoundingClientRect();
          const x = event.clientX - box.left;
          const y = event.clientY - box.top;
          if (!lit) {
            /* switch on where the pointer came in, not where it last left */
            lit = true;
            toX(x, x);
            toY(y, y);
            gsap.to(light, { opacity: 1, duration: 0.9, overwrite: "auto" });
            return;
          }
          toX(x);
          toY(y);
        };
        const leave = () => {
          lit = false;
          gsap.to(light, { opacity: 0, duration: 0.7, overwrite: "auto" });
        };

        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
        return () => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
        };
      },
    );
  });

  return (
    <span
      ref={ref}
      className="absolute top-0 left-0 aspect-square w-[calc(520*var(--k))] -translate-1/2 rounded-full bg-[radial-gradient(circle_closest-side,rgb(108_92_242/0.42)_0%,rgb(128_114_246/0.2)_50%,rgb(150_140_250/0)_100%)] opacity-0 blur-[calc(24*var(--k))]"
    />
  );
}
