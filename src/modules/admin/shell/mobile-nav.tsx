"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { SidebarNav, type Menu } from "./nav";

const burger = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
  </svg>
);

const close = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden="true"
  >
    <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" strokeLinecap="round" />
  </svg>
);

/**
 * The dashboard menu on phones and tablets: a burger that slides the sidebar
 * in over the page. `brand` and `footer` come from the shell, which is a
 * server component — the account menu and the sign-out form keep their server
 * actions that way. The drawer closes on navigation, on Escape and on a tap
 * outside it, and the page behind it does not scroll while it is open.
 */
export function MobileNav({
  menu = "admin",
  brand,
  footer,
}: {
  menu?: Menu;
  brand: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  /* The route the drawer was opened on. Navigating changes the pathname,
     which closes the drawer on its own — no effect needed for that. */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="dashboard-drawer"
        className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-[#c7c9d4] transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        {burger}
        <span className="sr-only">Buka menu</span>
      </button>

      {/* Kept mounted so the panel slides rather than blinks into place. */}
      <div
        className="fixed inset-0 z-50 lg:hidden"
        /* While closed it is inert: nothing in it can be tabbed to or read
           out, and taps pass through to the page. */
        inert={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          id="dashboard-drawer"
          ref={panel}
          role="dialog"
          aria-modal={open || undefined}
          aria-label="Menu dashboard"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 flex w-[min(19rem,85vw)] flex-col border-r border-white/[0.06] bg-[#0b0e22] transition-transform duration-200 outline-none ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-5">
            {brand}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#8a8ea3] transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              {close}
              <span className="sr-only">Tutup menu</span>
            </button>
          </div>

          <nav
            aria-label="Dashboard"
            className="flex-1 overflow-y-auto px-4 pt-5 pb-4"
          >
            <p className="mb-3 px-1 text-xs tracking-[0.08em] text-[#8a8ea3] uppercase">
              Menu
            </p>
            <SidebarNav menu={menu} />
          </nav>

          <div className="border-t border-white/[0.06] p-3">{footer}</div>
        </div>
      </div>
    </>
  );
}
