"use client";

import { useActionState, useState } from "react";

import { signIn, type SignInState } from "../auth/actions";

const field =
  "h-12 w-full rounded-[10px] border border-white/[0.08] bg-[#26283a] px-4 text-[15px] text-white " +
  "placeholder:text-[#6f7286] transition-[border-color,box-shadow] duration-150 " +
  "focus-visible:border-curtain/70 focus-visible:ring-4 focus-visible:ring-curtain/20 focus-visible:outline-none";

const label = "mb-2.5 block text-[13px] font-medium text-[#c7c9d4]";

export function LoginForm({ contactEmail }: { contactEmail: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signIn,
    {},
  );
  const [username, setUsername] = useState(state.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const ready = username.trim() !== "" && password !== "";

  return (
    <form action={action} className="mt-10" noValidate>
      <label htmlFor="username" className={label}>
        Username
      </label>
      <input
        id="username"
        name="username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="spemedcre"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "login-error" : undefined}
        className={field}
      />

      <label htmlFor="password" className={`${label} mt-6`}>
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className={`${field} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-lg text-[#7c7f92] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-curtain"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {showPassword && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <a
          href={`mailto:${contactEmail}?subject=${encodeURIComponent("Reset password dashboard SPE UGM")}`}
          className="text-[13px] text-[#3b82f6] transition-colors hover:text-[#60a5fa]"
        >
          Lupa password?
        </a>
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="mt-5 rounded-[10px] border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || pending}
        className="mt-6 h-[50px] w-full rounded-[10px] bg-curtain text-[15px] font-semibold text-white transition-colors hover:bg-[#6060ff] disabled:cursor-not-allowed disabled:bg-[#2a2c3e] disabled:text-[#5b5e71]"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
