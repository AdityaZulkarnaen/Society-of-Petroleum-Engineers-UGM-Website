import Image from "next/image";
import { redirect } from "next/navigation";

import { getAdmin } from "../auth/session";
import { ADMIN_CONTACT_EMAIL } from "../constants";
import { LoginForm } from "./login-form";

export async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#0e1022] bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,#161a33_0%,#0e1022_100%)] px-4 py-12 text-white">
      <div className="w-full max-w-[472px] rounded-3xl border border-white/[0.08] bg-[linear-gradient(180deg,#25273a_0%,#1b1d2d_100%)] px-6 py-10 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] sm:px-10 sm:py-11">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/global/logo.webp"
            alt=""
            width={169}
            height={147}
            priority
            className="h-9 w-auto"
          />
          <div className="leading-tight">
            <p className="text-[17px] font-bold tracking-[-0.01em]">SPE UGM</p>
            <p className="mt-0.5 text-[11px] tracking-[0.04em] text-[#8a8ea3] uppercase">
              Student Chapter
            </p>
          </div>
        </div>

        <div
          className="mt-6 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]"
          aria-hidden="true"
        />

        <h1 className="mt-8 text-center text-[22px] font-bold tracking-[-0.015em]">
          Masuk ke Dashboard Pengurus
        </h1>
        <p className="mt-3 text-center text-[13px] text-[#8a8ea3]">
          Gunakan akun yang sudah diberikan oleh admin SPE UGM
        </p>

        <LoginForm contactEmail={ADMIN_CONTACT_EMAIL} />
      </div>

      <p className="mt-7 text-center text-xs text-[#5d6075]">
        Butuh akses? Hubungi admin di{" "}
        <a
          href={`mailto:${ADMIN_CONTACT_EMAIL}`}
          className="text-[#9a9db0] transition-colors hover:text-white"
        >
          {ADMIN_CONTACT_EMAIL}
        </a>
      </p>
    </main>
  );
}
