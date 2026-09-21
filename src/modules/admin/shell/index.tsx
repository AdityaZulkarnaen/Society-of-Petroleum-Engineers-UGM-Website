import Image from "next/image";
import type { ReactNode } from "react";

import { signOut } from "../auth/actions";
import { requireAdmin, type Admin } from "../auth/session";
import { Avatar } from "../components/ui";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./nav";

export function Brand({
  subtitle = "Dashboard Pengurus",
}: {
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/global/logo-light.webp"
        alt=""
        width={169}
        height={147}
        priority
        className="h-8 w-auto"
      />
      <div className="leading-tight">
        <p className="text-sm font-bold text-white">SPE UGM SC</p>
        <p className="mt-0.5 text-[11px] tracking-[0.06em] text-[#6f7286] uppercase">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/** The signed-in account, opening a menu with sign-out. */
function AccountMenu({
  admin,
  compact = false,
}: {
  admin: Admin;
  compact?: boolean;
}) {
  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden ${
          compact ? "p-1" : "p-3"
        }`}
      >
        <Avatar name={admin.fullName} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-white">
                {admin.fullName.split(" ")[0]}
              </span>
              <span className="mt-0.5 block truncate text-xs text-[#6f7286]">
                {admin.position ?? admin.division?.name ?? admin.username}
              </span>
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[#6f7286] transition-transform group-open:-rotate-90"
              aria-hidden="true"
            >
              <path
                d="m6 4 4 4-4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
        <span className="sr-only">Menu akun</span>
      </summary>

      <div
        className={`absolute z-20 w-56 rounded-xl border border-white/10 bg-[#161a31] p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] ${
          compact ? "top-full right-0 mt-2" : "bottom-full left-0 mb-2"
        }`}
      >
        <p className="truncate px-3 pt-2 pb-2.5 text-xs text-[#6f7286]">
          Masuk sebagai{" "}
          <span className="text-[#c7c9d4]">@{admin.username}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex h-9 w-full items-center rounded-lg px-3 text-left text-[13px] font-medium text-[#fca5a5] transition-colors hover:bg-white/[0.04]"
          >
            Keluar
          </button>
        </form>
      </div>
    </details>
  );
}

export async function AdminShell({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-svh bg-[#080b1c] text-white lg:flex">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0e22] lg:flex">
        <div className="border-b border-white/[0.06] px-6 py-6">
          <Brand />
        </div>

        <nav aria-label="Dashboard" className="flex-1 px-5 pt-6">
          <p className="mb-3 px-1 text-xs tracking-[0.08em] text-[#8a8ea3] uppercase">
            Menu
          </p>
          <SidebarNav />
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <AccountMenu admin={admin} />
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0b0e22] px-4 lg:hidden">
        <div className="flex h-16 items-center gap-3">
          <MobileNav brand={<Brand />} footer={<AccountMenu admin={admin} />} />
          <div className="min-w-0 flex-1">
            <Brand />
          </div>
          <AccountMenu admin={admin} compact />
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
