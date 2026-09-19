"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* Every dashboard dialog: dark panel over a dimmed, blurred backdrop, with a
   short scale-in. */
export const modalSurface =
  "m-auto w-[calc(100%-32px)] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#151a38_0%,#0b0e22_100%)] p-0 text-white " +
  "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] " +
  "transition-[opacity,scale,display,overlay] transition-discrete duration-200 starting:open:scale-95 starting:open:opacity-0 " +
  "backdrop:bg-[#03040d]/75 backdrop:backdrop-blur-sm";

/**
 * A native modal <dialog>, driven by `open`. Esc and a click on the backdrop
 * call `onClose`, except while `busy`.
 */
export function Modal({
  open,
  onClose,
  busy = false,
  labelledBy,
  className = "max-w-[540px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className={`${modalSurface} ${className}`}
    >
      {open && children}
    </dialog>
  );
}

/** Title row with the close button, as in the account dialogs. */
export function ModalHeader({
  id,
  title,
  onClose,
  disabled = false,
}: {
  id: string;
  title: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 id={id} className="text-lg font-bold tracking-[-0.01em]">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        aria-label="Tutup"
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[#a3a6b8] transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m3 3 8 8M11 3l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
