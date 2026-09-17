import Image from "next/image";

import { signOut } from "../auth/actions";
import { requireAdmin } from "../auth/session";

const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Admin",
} as const;

export async function DashboardPage() {
  const admin = await requireAdmin();

  return (
    <div className="min-h-svh bg-[#0e1022] text-white">
      <header className="border-b border-white/[0.06] bg-[#141628]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Image
            src="/global/logo.webp"
            alt=""
            width={169}
            height={147}
            className="h-8 w-auto"
          />
          <p className="text-[15px] font-bold">SPE UGM</p>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-[13px] font-medium">
                {admin.fullName || admin.username}
              </p>
              <p className="text-xs text-[#8a8ea3]">
                {ROLE_LABEL[admin.role]}
                {admin.division && ` · ${admin.division.name}`}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="h-9 rounded-lg border border-white/10 px-3.5 text-[13px] font-medium text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-[-0.015em]">
          Halo, {admin.fullName || admin.username}
        </h1>
        <p className="mt-2 text-sm text-[#8a8ea3]">
          Dashboard pengurus sedang disiapkan.
        </p>
      </main>
    </div>
  );
}
