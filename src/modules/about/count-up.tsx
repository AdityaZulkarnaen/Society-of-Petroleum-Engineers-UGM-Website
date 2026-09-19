"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const DURATION = 1600;

/* layout effect in the browser only, so the reset lands before first paint */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that counts up from 0 the first time it scrolls into view:
 * 1, 2, 3 … up to `value`. The server renders the final value, so it reads
 * right without JavaScript; with reduced motion it simply stays there.
 */
export function CountUp({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setShown(0);

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          setShown(Math.round(easeOut(t) * value));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {/* the final figure for assistive tech; the ticking one is decoration */}
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden="true" className="tabular-nums">
        {shown}
        {suffix}
      </span>
    </span>
  );
}
