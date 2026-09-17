"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
};

/* Reveal starts when the paragraph's top enters at START of the viewport and
   finishes when its middle reaches END. */
const START = 0.92;
const END = 0.42;

/**
 * Lights the text up character by character as it scrolls through the
 * viewport. Only one custom property (`--reveal`, 0 → 1) changes on scroll;
 * each character derives its own opacity from it in CSS.
 */
export function ScrollRevealText({ text, className }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);

  /* each word with the running index of its first character */
  const words = text.split(" ").reduce<{ word: string; start: number }[]>(
    (acc, word) => {
      const prev = acc.at(-1);
      acc.push({ word, start: prev ? prev.start + prev.word.length : 0 });
      return acc;
    },
    [],
  );
  const count = text.replaceAll(" ", "").length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--reveal", "1");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const from = vh * START;
      const to = vh * END - rect.height / 2;
      const progress = (from - rect.top) / (from - to);
      el.style.setProperty(
        "--reveal",
        String(Math.min(1, Math.max(0, progress))),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <p
      ref={ref}
      className={className}
      style={{ "--reveal": 0, "--count": count } as CSSProperties}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map(({ word, start }, w) => (
          <span key={w}>
            <span className="inline-block whitespace-nowrap">
              {/* unread characters stay at 28% so the sentence still
                  reads as one block before it lights up */}
              {Array.from(word, (char, c) => (
                <span
                  key={c}
                  className="opacity-[clamp(0.28,calc(var(--reveal)*var(--count)_-_var(--i)),1)] transition-opacity duration-150"
                  style={{ "--i": start + c } as CSSProperties}
                >
                  {char}
                </span>
              ))}
            </span>
            {w < words.length - 1 && " "}
          </span>
        ))}
      </span>
    </p>
  );
}
