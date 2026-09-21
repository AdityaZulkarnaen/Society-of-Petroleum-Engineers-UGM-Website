import type { ReactNode } from "react";

import { signOut } from "@/modules/admin/auth/actions";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { Brand } from "@/modules/admin/shell";
import { MobileNav } from "@/modules/admin/shell/mobile-nav";
import { SidebarNav } from "@/modules/admin/shell/nav";

const logoutIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path
      d="M7 15.25H4a1.25 1.25 0 0 1-1.25-1.25V4A1.25 1.25 0 0 1 4 2.75h3"
      strokeLinecap="round"
    />
    <path
      d="M11.5 12.5 15 9l-3.5-3.5M15 9H6.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={`flex items-center gap-3 rounded-xl text-[15px] text-[#8a8ea3] transition-colors hover:bg-white/[0.03] hover:text-[#fca5a5] ${
          compact ? "size-10 justify-center" : "h-11 w-full px-3.5"
        }`}
      >
        {logoutIcon}
        <span className={compact ? "sr-only" : undefined}>Keluar</span>
      </button>
    </form>
  );
}

export async function SuperAdminShell({ children }: { children: ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="min-h-svh bg-[#080b1c] text-white lg:flex">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0e22] lg:flex">
        <div className="border-b border-white/[0.06] px-5 py-6">
          <Brand subtitle="Dashboard Super Admin" />
        </div>

        <nav
          aria-label="Dashboard"
          className="flex-1 overflow-y-auto px-4 pt-6"
        >
          <p className="mb-3 px-1 text-xs tracking-[0.08em] text-[#8a8ea3] uppercase">
            Admin Menu
          </p>
          <SidebarNav menu="superAdmin" />
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0b0e22] px-4 lg:hidden">
        <div className="flex h-16 items-center gap-3">
          <MobileNav
            menu="superAdmin"
            brand={<Brand subtitle="Dashboard Super Admin" />}
            footer={<SignOutButton />}
          />
          <div className="min-w-0 flex-1">
            <Brand subtitle="Dashboard Super Admin" />
          </div>
          <SignOutButton compact />
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
