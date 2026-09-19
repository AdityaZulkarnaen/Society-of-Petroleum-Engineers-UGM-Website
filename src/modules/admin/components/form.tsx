import type { ComponentProps, ReactNode } from "react";

/* Form fields for the dashboard dialogs (Manajemen Akun, Acara & Proker). */

/* No height, so textareas can use it too; dark scheme for date pickers. */
export const controlBase =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white [color-scheme:dark] " +
  "placeholder:text-[#6f7286] transition-[border-color,box-shadow] " +
  "focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none " +
  "aria-invalid:border-[#f87171]/60 disabled:cursor-not-allowed";

export const control = `${controlBase} h-[42px]`;

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-[#fca5a5]">
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({ children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${control} appearance-none pr-10 [&_option]:bg-[#151a38] [&_optgroup]:bg-[#151a38]`}
      >
        {children}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#8a8ea3]"
      >
        <path d="m3 4.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
