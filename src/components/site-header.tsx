"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { outlineButton, pillSolid } from "@/components/ui/button-styles";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "About us", href: "#about" },
  { label: "Cabinet", href: "#cabinet" },
  { label: "Event", href: "#event" },
  { label: "Apecx", href: "#apecx" },
  { label: "Contact", href: "#contact" },
];

/**
 * The header floats as a rounded bar while the page's `[data-nav-float]`
 * section (the hero) is still under it, and docks to the top at full width
 * once that section has scrolled away. Pages without such a section get the
 * docked bar straight away, and phones always do (see the `docked` variant).
 */
function useDocked(navRef: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname();
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const zone = document.querySelector("[data-nav-float]");

    let frame = 0;
    const update = () => {
      frame = 0;
      if (!zone) return setDocked(true);
      const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      setDocked(zone.getBoundingClientRect().bottom <= navBottom);
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
  }, [pathname, navRef]);

  return docked;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const docked = useDocked(navRef);

  return (
    <header
      data-docked={docked || undefined}
      className="fixed inset-x-0 top-[3svh] z-50 animate-nav-in transition-[top] duration-500 ease-out-soft docked:top-0 motion-reduce:animate-none"
    >
      <nav
        ref={navRef}
        aria-label="Main"
        className={[
          "mx-auto flex h-(--nav-h) items-center border bg-white",
          "transition-[width,margin,padding,border-radius,border-color,box-shadow] duration-500 ease-out-soft",
          /* floating */
          "mt-[calc(13*var(--k))] w-[min(calc(1270*var(--kw)),calc(100%_-_2rem))] rounded-[clamp(18px,calc(24*var(--k)),30px)] border-white/55 px-[clamp(10px,calc(10*var(--k)),18px)] shadow-nav",
          /* docked — the inner padding keeps the logo and button where they
             sat in the floating bar */
          "docked:mt-0 docked:w-full docked:rounded-none docked:border-transparent docked:border-b-[#ececf6] docked:px-[max(1rem,calc((100%_-_min(calc(1270*var(--kw)),calc(100%_-_2rem)))/2_+_clamp(10px,calc(10*var(--k)),18px)))] docked:shadow-nav-docked",
        ].join(" ")}
      >
        <a
          href="#home"
          className="flex shrink-0 items-center rounded-xl"
          aria-label="SPE UGM Student Chapter — home"
        >
          <Image
            src="/global/logo.webp"
            alt="SPE UGM Student Chapter"
            width={169}
            height={147}
            priority
            className="h-[clamp(38px,calc(54*var(--k)),66px)] w-auto"
          />
        </a>

        <ul className="hidden flex-1 items-center justify-center gap-[calc(31*var(--k))] md:flex">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="relative text-[clamp(13.5px,calc(15*var(--k)),18px)] font-medium tracking-[-0.005em] text-ink-nav transition-colors duration-200 ease-out-soft after:absolute after:-bottom-[0.45em] after:left-1/2 after:h-[1.5px] after:w-0 after:-translate-x-1/2 after:rounded-xs after:bg-ink-deep after:transition-[width] after:duration-200 after:ease-out-soft hover:text-ink-deep hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* on phones the CTA lives in the menu */}
        <div className="ml-auto hidden md:block">
          <a href="#join" className={outlineButton}>
            Join SPE
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="ml-auto grid size-11 place-items-center rounded-xl border border-[#e4e4f0] bg-white/80 text-ink-deep transition-colors hover:bg-white md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <path d="M5 5l10 10" />
                <path d="M15 5L5 15" />
              </>
            ) : (
              <>
                <path d="M3 6.5h14" />
                <path d="M3 13.5h14" />
              </>
            )}
          </svg>
        </button>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="mx-4 mt-2 rounded-2xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_40px_-20px_rgba(60,48,122,0.35)] backdrop-blur-xl md:hidden"
      >
        <ul className="flex flex-col">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-[15px] font-medium text-ink-nav transition-colors hover:bg-[#f4f3fc] hover:text-ink-deep"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#join"
          onClick={() => setOpen(false)}
          className={`${pillSolid} mt-1 w-full`}
        >
          Join SPE
        </a>
      </div>
    </header>
  );
}
