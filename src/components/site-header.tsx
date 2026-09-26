"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { outlineButton, pillSolid } from "@/components/ui/button-styles";

/* Home sections are linked as /#…, so the links also work from other pages. */
const LINKS = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
  { label: "Cabinet", href: "/#cabinet" },
  { label: "Event", href: "/#event" },
  { label: "APECX", href: "/#apecx" },
  { label: "Contact", href: "/#contact" },
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const docked = useDocked(navRef);
  return (
    <>
      <header
        data-docked={docked || undefined}
        className="fixed inset-x-0 top-[3svh] z-50 animate-nav-in transition-[top] duration-500 ease-out-soft docked:top-0 motion-reduce:animate-none"
      >
        <nav
          ref={navRef}
          aria-label="Main"
          className={[
            "mx-auto flex h-(--nav-h) items-center border bg-white/85 backdrop-blur-xl",
            "transition-[width,margin,padding,border-radius,border-color,box-shadow,background-color] duration-500 ease-out-soft",
            /* floating style */
            "mt-[calc(13*var(--k))] w-[min(calc(1270*var(--kw)),calc(100%_-_2rem))] rounded-[clamp(18px,calc(24*var(--k)),30px)] border-white/30 px-[clamp(10px,calc(10*var(--k)),18px)] shadow-nav",
            /* docked style - overrides when scrolled */
            "docked:mt-0 docked:w-full docked:rounded-none docked:border-b docked:border-white/40 docked:px-[clamp(1rem,5vw,5rem)] docked:shadow-nav-docked",
            /* phones: a plain white bar */
            "max-md:border-[#ececf5] max-md:bg-white max-md:backdrop-blur-none",
          ].join(" ")}
        >
          <Link
            href="/"
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
          </Link>

          <ul className="hidden flex-1 items-center justify-center gap-[calc(31*var(--k))] md:flex">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  aria-current={link.href === pathname ? "page" : undefined}
                  className="text-[clamp(13.5px,calc(15*var(--k)),18px)] font-medium tracking-[-0.005em] text-ink-nav transition-all duration-1000 ease-out-soft rounded-lg px-3 py-1.5 hover:bg-iris/8 hover:text-iris hover:-translate-y-0.5 hover:shadow-sm aria-[current=page]:bg-iris/10 aria-[current=page]:text-iris aria-[current=page]:font-semibold aria-[current=page]:shadow-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* on phones the CTA lives in the menu */}
          <div className="ml-auto hidden md:block">
            <Link href="/#join" className={outlineButton}>
              Join SPE
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="ml-auto grid size-11 place-items-center rounded-xl text-ink-deep transition-colors hover:bg-white md:hidden"
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

        {/* Full-width sheet that slides down from behind the bar; the
            negative z keeps it under the nav while it travels. */}
        <div
          id="mobile-nav"
          inert={!open}
          className={`absolute inset-x-0 top-full -z-10 border-b border-[#ececf5] bg-white px-4 pt-2 pb-5 shadow-[0_24px_40px_-24px_rgba(60,48,122,0.35)] transition-[translate,opacity] duration-500 ease-out-soft motion-reduce:transition-none md:hidden ${
            open ? "translate-y-0" : "pointer-events-none -translate-y-full opacity-0"
          }`}
        >
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={link.href === pathname ? "page" : undefined}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-ink-nav transition-colors hover:bg-[#f4f3fc] hover:text-ink-deep aria-[current=page]:bg-[#f4f3fc] aria-[current=page]:text-ink-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#join"
            onClick={() => setOpen(false)}
            className={`${pillSolid} mt-1 w-full`}
          >
            Join SPE
          </Link>
        </div>
      </header>
    </>
  );
}
